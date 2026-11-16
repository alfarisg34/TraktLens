// popup.js - Trakt Watch Summary Sync

document.addEventListener('DOMContentLoaded', async () => {
  const targetUrlInput = document.getElementById('target-url');
  const datePresetSelect = document.getElementById('date-range-preset');
  const customContainer = document.getElementById('custom-date-container');
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');
  const btnSync = document.getElementById('btn-sync');
  const btnOpenWeb = document.getElementById('btn-open-web');
  const userStatusPill = document.getElementById('user-status-pill');
  const userNameEl = document.getElementById('user-name');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  const statusText = document.getElementById('status-text');

  // Load saved target URL
  const stored = await chrome.storage.local.get(['targetUrl']);
  if (stored.targetUrl) {
    targetUrlInput.value = stored.targetUrl;
  }

  targetUrlInput.addEventListener('change', () => {
    chrome.storage.local.set({ targetUrl: targetUrlInput.value.trim() });
  });

  datePresetSelect.addEventListener('change', () => {
    if (datePresetSelect.value === 'custom') {
      customContainer.classList.remove('hidden');
    } else {
      customContainer.classList.add('hidden');
    }
  });

  btnOpenWeb.addEventListener('click', () => {
    chrome.tabs.create({ url: targetUrlInput.value.trim() });
  });

  // Cari tab trakt
  async function getTraktTab() {
    const tabs = await chrome.tabs.query({ url: '*://app.trakt.tv/*' });
    return tabs.length > 0 ? tabs[0] : null;
  }

  // Periksa status login trakt
  let activeTab = await getTraktTab();

  if (!activeTab) {
    userStatusPill.className = 'status-pill offline';
    userNameEl.textContent = 'Buka app.trakt.tv';
    btnSync.disabled = true;
    statusText.textContent = 'Buka app.trakt.tv terlebih dahulu di salah satu tab browser.';
    progressContainer.classList.remove('hidden');
  } else {
    try {
      chrome.tabs.sendMessage(activeTab.id, { action: 'GET_SESSION' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          userStatusPill.className = 'status-pill offline';
          userNameEl.textContent = 'Belum Login';
          btnSync.disabled = true;
          statusText.textContent = 'Silakan login di tab app.trakt.tv terlebih dahulu.';
          progressContainer.classList.remove('hidden');
        } else {
          userStatusPill.className = 'status-pill online';
          userNameEl.textContent = response.user.username;
          btnSync.disabled = false;
        }
      });
    } catch (e) {
      userStatusPill.className = 'status-pill offline';
      userNameEl.textContent = 'Koneksi error';
    }
  }

  // Action sync
  btnSync.addEventListener('click', async () => {
    activeTab = await getTraktTab();
    if (!activeTab) {
      alert('Tab app.trakt.tv tidak ditemukan!');
      return;
    }

    btnSync.disabled = true;
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '20%';
    statusText.textContent = 'Mengambil data dari Trakt API...';

    // Hitung tanggal
    let startDate = null;
    let endDate = null;
    const preset = datePresetSelect.value;

    if (preset === 'custom') {
      if (startDateInput.value) startDate = startDateInput.value;
      if (endDateInput.value) endDate = endDateInput.value;
    } else if (preset !== 'all') {
      const days = parseInt(preset, 10);
      const d = new Date();
      d.setDate(d.getDate() - days);
      startDate = d.toISOString();
    }

    chrome.tabs.sendMessage(activeTab.id, {
      action: 'EXTRACT_HISTORY',
      startDate,
      endDate,
      maxItems: 3000
    }, async (res) => {
      if (chrome.runtime.lastError || !res || !res.success) {
        progressBar.style.width = '0%';
        statusText.textContent = 'Gagal: ' + (res?.error || chrome.runtime.lastError?.message || 'Unknown error');
        btnSync.disabled = false;
        return;
      }

      progressBar.style.width = '60%';
      statusText.textContent = `Berhasil mengekstrak ${res.total} item. Mengirim ke Web...`;

      try {
        const targetUrl = targetUrlInput.value.replace(/\/$/, '');
        const items = res.items || [];
        const CHUNK_SIZE = 150;
        const totalChunks = Math.ceil(items.length / CHUNK_SIZE);
        let totalUploaded = 0;

        for (let i = 0; i < totalChunks; i++) {
          const chunk = items.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          const percent = 60 + Math.round(((i + 1) / totalChunks) * 38);
          progressBar.style.width = `${percent}%`;
          statusText.textContent = `Mengirim ke database (${i + 1}/${totalChunks})... ${Math.min((i + 1) * CHUNK_SIZE, items.length)}/${items.length} item`;

          const response = await fetch(`${targetUrl}/api/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user: res.user,
              items: chunk
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText.slice(0, 120)}`);
          }

          const json = await response.json();
          if (!json.success) {
            throw new Error(json.error || `Gagal di batch ${i + 1}`);
          }
          totalUploaded += json.savedCount || chunk.length;
        }

        progressBar.style.width = '100%';
        statusText.textContent = `Selesai! Berhasil menyimpan ${totalUploaded} item ke database cloud.`;
      } catch (err) {
        progressBar.style.width = '50%';
        statusText.textContent = `Gagal upload ke Web (${err.message}). Pastikan server Web berjalan!`;
      } finally {
        btnSync.disabled = false;
      }
    });
  });
});
