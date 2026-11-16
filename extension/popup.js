// popup.js - TraktLens Popup Controller
// Mengirim perintah sinkronisasi ke Background Service Worker (background.js)
// agar proses ekstraksi tetap berjalan lancar di belakang layar (background)
// meskipun popup ditutup, tab berpindah, atau browser di-minimize.

document.addEventListener('DOMContentLoaded', async () => {
  const targetUrlInput = document.getElementById('target-url');
  const datePresetSelect = document.getElementById('date-range-preset');
  const incrementalSyncInput = document.getElementById('incremental-sync');
  const customContainer = document.getElementById('custom-date-container');
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');
  const btnSync = document.getElementById('btn-sync');
  const btnCancel = document.getElementById('btn-cancel');
  const btnOpenWeb = document.getElementById('btn-open-web');
  const userStatusPill = document.getElementById('user-status-pill');
  const userNameEl = document.getElementById('user-name');
  const progressContainer = document.getElementById('progress-container');
  const progressBar = document.getElementById('progress-bar');
  const statusText = document.getElementById('status-text');

  // 1. Muat URL tersimpan
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

  // 2. Periksa status login di tab app.trakt.tv
  async function checkTraktTabStatus() {
    try {
      const tabs = await chrome.tabs.query({ url: '*://app.trakt.tv/*' });
      if (!tabs || tabs.length === 0) {
        userStatusPill.className = 'status-pill offline';
        userNameEl.textContent = 'Buka app.trakt.tv';
        return false;
      }

      return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'GET_SESSION' }, (response) => {
          if (chrome.runtime.lastError || !response || !response.success) {
            userStatusPill.className = 'status-pill offline';
            userNameEl.textContent = 'Belum Login';
            resolve(false);
          } else {
            userStatusPill.className = 'status-pill online';
            userNameEl.textContent = response.user.username;
            resolve(true);
          }
        });
      });
    } catch {
      userStatusPill.className = 'status-pill offline';
      userNameEl.textContent = 'Koneksi error';
      return false;
    }
  }

  await checkTraktTabStatus();

  // 3. Render Status Sinkronisasi dari Background
  function renderSyncState(state) {
    if (!state) return;

    if (state.isRunning) {
      progressContainer.classList.remove('hidden');
      btnCancel.classList.remove('hidden');
      btnSync.disabled = true;
      btnSync.innerHTML = '<span>⏳ Sinkronisasi Berjalan di Background...</span>';

      const pct = Math.max(0, Math.min(100, Math.round(state.progress || 0)));
      progressBar.style.width = `${pct}%`;
      progressBar.style.background = '#ed1c24';

      statusText.className = 'status-text running';
      statusText.textContent = state.message || `Memproses di background (${pct}%)...`;
    } else {
      btnCancel.classList.add('hidden');
      btnSync.disabled = false;
      btnSync.innerHTML = '<span class="icon">🔄</span><span>Ekstrak & Sinkronkan</span>';

      if (state.status === 'success') {
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '100%';
        progressBar.style.background = '#10b981';
        statusText.className = 'status-text success';
        statusText.textContent = state.message || 'Sinkronisasi berhasil!';
      } else if (state.status === 'error') {
        progressContainer.classList.remove('hidden');
        progressBar.style.width = '100%';
        progressBar.style.background = '#ef4444';
        statusText.className = 'status-text error';
        statusText.textContent = state.message || 'Terjadi kesalahan saat sinkronisasi.';
      } else if (state.status === 'idle' && !state.message) {
        progressContainer.classList.add('hidden');
      }
    }
  }

  // Muat status background awal saat popup dibuka
  const stateRes = await chrome.storage.local.get(['syncState']);
  if (stateRes.syncState) {
    renderSyncState(stateRes.syncState);
  }

  // Dengarkan pembaruan real-time dari background worker
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.syncState) {
      renderSyncState(changes.syncState.newValue);
    }
  });

  // 4. Tombol Mulai Sinkronisasi
  btnSync.addEventListener('click', async () => {
    const isOnline = await checkTraktTabStatus();
    if (!isOnline) {
      alert('Tab app.trakt.tv belum aktif atau Anda belum login!\nBuka app.trakt.tv terlebih dahulu di salah satu tab browser.');
      return;
    }

    let startDate = null;
    let endDate = null;
    const targetUrl = targetUrlInput.value.trim().replace(/\/$/, '');
    const preset = datePresetSelect.value;
    const incremental = incrementalSyncInput.checked;

    if (preset === 'custom') {
      if (startDateInput.value) startDate = startDateInput.value;
      if (endDateInput.value) endDate = endDateInput.value;
    } else if (preset !== 'all') {
      const days = parseInt(preset, 10);
      const d = new Date();
      d.setDate(d.getDate() - days);
      startDate = d.toISOString();
    }

    // Tampilkan status awal di UI
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '5%';
    progressBar.style.background = '#ed1c24';
    statusText.className = 'status-text running';
    statusText.textContent = 'Memulai proses di background service worker...';
    btnSync.disabled = true;

    // Perintahkan background.js untuk memulai proses di background
    chrome.runtime.sendMessage({
      action: 'START_SYNC',
      options: {
        targetUrl,
        preset,
        startDate,
        endDate,
        incremental
      }
    }, (res) => {
      if (chrome.runtime.lastError) {
        statusText.className = 'status-text error';
        statusText.textContent = 'Gagal mengirim sinyal ke background worker: ' + chrome.runtime.lastError.message;
        btnSync.disabled = false;
      }
    });
  });

  // 5. Tombol Batalkan Sinkronisasi
  btnCancel.addEventListener('click', () => {
    btnCancel.disabled = true;
    btnCancel.textContent = 'Membatalkan...';
    chrome.runtime.sendMessage({ action: 'CANCEL_SYNC' }, () => {
      btnCancel.disabled = false;
      btnCancel.textContent = 'Batalkan Proses';
    });
  });
});
