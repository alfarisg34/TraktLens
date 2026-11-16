// background.js - TraktLens Background Service Worker
// Menjalankan proses ekstraksi dan sinkronisasi tontonan di latar belakang (background)
// tanpa terhenti ketika popup ditutup, tab berpindah, atau browser di-minimize.

let currentSyncAbortController = null;

// Inisialisasi state saat ekstensi terpasang atau browser dibuka
chrome.runtime.onInstalled.addListener(() => {
  initSyncState();
});

chrome.runtime.onStartup.addListener(() => {
  initSyncState();
});

async function initSyncState() {
  const data = await chrome.storage.local.get(['syncState']);
  if (!data.syncState || data.syncState.isRunning) {
    await chrome.storage.local.set({
      syncState: {
        isRunning: false,
        status: 'idle',
        progress: 0,
        message: 'Siap untuk sinkronisasi',
        updatedAt: Date.now()
      }
    });
    chrome.action.setBadgeText({ text: '' });
  }
}

// Update state sinkronisasi ke storage dan badge toolbar
async function updateSyncState(state) {
  try {
    const current = (await chrome.storage.local.get(['syncState'])).syncState || {};
    const merged = { ...current, ...state, updatedAt: Date.now() };
    await chrome.storage.local.set({ syncState: merged });

    // Perbarui badge pada ikon ekstensi di toolbar Chrome
    if (merged.isRunning) {
      const pct = Math.max(1, Math.min(99, Math.round(merged.progress || 0)));
      chrome.action.setBadgeText({ text: `${pct}%` });
      chrome.action.setBadgeBackgroundColor({ color: '#ed1c24' });
    } else if (merged.status === 'success') {
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
      }, 7000);
    } else if (merged.status === 'error') {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (err) {
    console.error('Failed to update sync state:', err);
  }
}

// Dapatkan sesi login dari tab app.trakt.tv yang sedang terbuka
async function getSessionFromTraktTab() {
  const tabs = await chrome.tabs.query({ url: '*://app.trakt.tv/*' });
  if (!tabs || tabs.length === 0) {
    throw new Error('Tab app.trakt.tv tidak ditemukan! Buka app.trakt.tv di salah satu tab browser.');
  }

  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'GET_SESSION' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error('Gagal menghubungi tab app.trakt.tv. Refresh halaman app.trakt.tv dan coba lagi.'));
        return;
      }
      if (!response || !response.success) {
        reject(new Error(response?.error || 'Belum login di app.trakt.tv. Silakan login terlebih dahulu.'));
        return;
      }
      resolve(response.user);
    });
  });
}

// Ambil riwayat tontonan dari API resmi Trakt secara bertahap (pagination)
async function fetchHistoryBatch({ accessToken, clientId, startDate, endDate, stopAtTimestamp, maxItems = 50000, signal, onProgress }) {
  const items = [];
  let page = 1;
  const limit = 100;
  let hasMore = true;
  const stopDateMs = stopAtTimestamp ? new Date(stopAtTimestamp).getTime() : null;

  while (hasMore && items.length < maxItems) {
    if (signal?.aborted) throw new Error('Sinkronisasi dibatalkan oleh pengguna.');

    const params = new URLSearchParams({
      extended: 'full',
      limit: limit.toString(),
      page: page.toString()
    });

    if (startDate) params.append('start_at', new Date(startDate).toISOString());
    if (endDate) params.append('end_at', new Date(endDate).toISOString());

    const url = `https://apiz.trakt.tv/users/me/history/?${params.toString()}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'trakt-api-key': clientId,
        'trakt-api-version': '2'
      },
      signal
    });

    if (!res.ok) {
      throw new Error(`Gagal memuat history Trakt (HTTP ${res.status}): ${res.statusText}`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      hasMore = false;
      break;
    }

    if (stopDateMs) {
      for (const item of data) {
        const itemDateMs = new Date(item.watched_at).getTime();
        if (itemDateMs <= stopDateMs) {
          hasMore = false;
          break;
        }
        items.push(item);
      }
      if (!hasMore) break;
    } else {
      items.push(...data);
    }

    const totalPages = parseInt(res.headers.get('x-pagination-page-count') || '1', 10);
    if (onProgress) {
      onProgress({ page, totalPages, totalFetched: items.length });
    }

    if (page >= totalPages || data.length < limit) {
      hasMore = false;
    } else {
      page++;
      // Jeda kecil agar sopan ke API Trakt
      await new Promise(r => setTimeout(r, 150));
    }
  }

  return items;
}

// Upload potongan data (chunk) ke Web Dashboard
async function uploadHistoryChunks({ targetUrl, user, items, signal, onProgress }) {
  const CHUNK_SIZE = 150;
  const totalChunks = Math.ceil(items.length / CHUNK_SIZE);
  let totalUploaded = 0;

  for (let i = 0; i < totalChunks; i++) {
    if (signal?.aborted) throw new Error('Sinkronisasi dibatalkan oleh pengguna.');

    const chunk = items.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);

    if (onProgress) {
      onProgress({
        chunkIndex: i + 1,
        totalChunks,
        uploadedItems: totalUploaded,
        totalItems: items.length
      });
    }

    const response = await fetch(`${targetUrl}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user,
        items: chunk
      }),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText.slice(0, 100)}`);
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(json.error || `Gagal di batch ${i + 1}`);
    }

    totalUploaded += json.savedCount || chunk.length;

    // Jeda kecil agar proses I/O aman
    if (i < totalChunks - 1) {
      await new Promise(r => setTimeout(r, 80));
    }
  }

  return totalUploaded;
}

// Proses utama sinkronisasi yang berjalan mandiri di background
async function runSyncProcess(options) {
  if (currentSyncAbortController) {
    currentSyncAbortController.abort();
  }
  currentSyncAbortController = new AbortController();
  const signal = currentSyncAbortController.signal;

  try {
    await updateSyncState({
      isRunning: true,
      status: 'running',
      progress: 5,
      message: 'Menghubungkan ke sesi Trakt.tv...',
      error: null
    });

    // 1. Dapatkan sesi login
    const user = await getSessionFromTraktTab();

    // 2. Incremental Sync check jika dipilih
    let stopAtTimestamp = options.stopAtTimestamp;
    const targetUrl = options.targetUrl.replace(/\/$/, '');

    if (options.incremental && !stopAtTimestamp && options.preset === 'all') {
      await updateSyncState({
        progress: 10,
        message: 'Mengecek rekaman tontonan terakhir di database...'
      });
      try {
        const checkRes = await fetch(`${targetUrl}/api/sync`, { signal });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.latestWatchedAt) {
            stopAtTimestamp = checkData.latestWatchedAt;
          }
        }
      } catch (e) {
        console.log('Incremental check skipped:', e.message);
      }
    }

    // 3. Ekstrak data dari Trakt
    await updateSyncState({
      progress: 15,
      message: 'Mulai mengunduh riwayat tontonan dari Trakt...'
    });

    const items = await fetchHistoryBatch({
      accessToken: user.accessToken,
      clientId: user.clientId,
      startDate: options.startDate,
      endDate: options.endDate,
      stopAtTimestamp,
      maxItems: 50000,
      signal,
      onProgress: ({ page, totalPages, totalFetched }) => {
        const calcPct = Math.min(55, 15 + Math.round((page / Math.max(1, totalPages || 10)) * 40));
        updateSyncState({
          progress: calcPct,
          message: `Mengunduh data Trakt (Hal ${page}/${totalPages || '?'}): ${totalFetched} tontonan ditemukan...`
        });
      }
    });

    if (items.length === 0) {
      await updateSyncState({
        isRunning: false,
        status: 'success',
        progress: 100,
        message: 'Semua data sudah mutakhir! Tidak ada tontonan baru untuk disinkronkan.'
      });
      return;
    }

    // 4. Mengunggah ke Web Dashboard
    await updateSyncState({
      progress: 55,
      message: `Ditemukan ${items.length} item. Mengirim ke Web Dashboard...`
    });

    const uploaded = await uploadHistoryChunks({
      targetUrl,
      user,
      items,
      signal,
      onProgress: ({ chunkIndex, totalChunks, uploadedItems, totalItems }) => {
        const calcPct = 55 + Math.round((chunkIndex / totalChunks) * 43);
        updateSyncState({
          progress: calcPct,
          message: `Menyimpan ke Web Dashboard (${chunkIndex}/${totalChunks}): ${Math.min(chunkIndex * 150, totalItems)}/${totalItems} item...`
        });
      }
    });

    await updateSyncState({
      isRunning: false,
      status: 'success',
      progress: 100,
      message: `Selesai! Berhasil mensinkronkan ${uploaded} item tontonan ke Web Dashboard.`
    });
  } catch (err) {
    if (signal.aborted) {
      await updateSyncState({
        isRunning: false,
        status: 'idle',
        progress: 0,
        message: 'Sinkronisasi dibatalkan.'
      });
    } else {
      await updateSyncState({
        isRunning: false,
        status: 'error',
        progress: 0,
        message: `Gagal: ${err.message}`
      });
    }
  } finally {
    currentSyncAbortController = null;
  }
}

// Router pesan runtime ekstensi
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'START_SYNC') {
    runSyncProcess(request.options);
    sendResponse({ success: true, started: true });
    return true;
  }

  if (request.action === 'CANCEL_SYNC') {
    if (currentSyncAbortController) {
      currentSyncAbortController.abort();
    }
    sendResponse({ success: true, cancelled: true });
    return true;
  }

  if (request.action === 'GET_SYNC_STATUS') {
    chrome.storage.local.get(['syncState'], (res) => {
      sendResponse(res.syncState || { isRunning: false, status: 'idle' });
    });
    return true;
  }
});
