// content.js - Trakt Watch Summary Extractor

function getTraktSession() {
  try {
    const oidcKey = Object.keys(localStorage).find(k => k.startsWith('oidc.user:'));
    if (!oidcKey) {
      return { success: false, error: 'Belum login di app.trakt.tv' };
    }
    const raw = localStorage.getItem(oidcKey);
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.access_token) {
      return { success: false, error: 'Token sesi tidak ditemukan' };
    }

    return {
      success: true,
      user: {
        username: parsed.profile?.u?.n || 'User',
        userId: parsed.profile?.sub || '',
        accessToken: parsed.access_token,
        clientId: parsed.profile?.aud || '201dc70c5ec6af530f12f079ea1922733f6e1085ad7b02f36d8e011b75bcea7d'
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function fetchHistoryBatch({ accessToken, clientId, startDate, endDate, maxItems = 1000, onProgress }) {
  const items = [];
  let page = 1;
  const limit = 100;
  let hasMore = true;

  while (hasMore && items.length < maxItems) {
    const params = new URLSearchParams({
      extended: 'full',
      limit: limit.toString(),
      page: page.toString()
    });

    if (startDate) params.append('start_at', new Date(startDate).toISOString());
    if (endDate) params.append('end_at', new Date(endDate).toISOString());

    const url = `https://apiz.trakt.tv/users/me/history/?${params.toString()}`;

    if (onProgress) {
      onProgress({ page, totalFetched: items.length });
    }

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'trakt-api-key': clientId,
        'trakt-api-version': '2'
      }
    });

    if (!res.ok) {
      throw new Error(`Gagal memuat history (HTTP ${res.status}): ${res.statusText}`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      hasMore = false;
      break;
    }

    items.push(...data);

    // Cek header pagination jika ada
    const totalPages = parseInt(res.headers.get('x-pagination-page-count') || '1', 10);
    if (page >= totalPages || data.length < limit) {
      hasMore = false;
    } else {
      page++;
      // Jeda kecil agar sopan ke API
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return items;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_SESSION') {
    sendResponse(getTraktSession());
    return true;
  }

  if (request.action === 'EXTRACT_HISTORY') {
    (async () => {
      try {
        const session = getTraktSession();
        if (!session.success) {
          sendResponse({ success: false, error: session.error });
          return;
        }

        const items = await fetchHistoryBatch({
          accessToken: session.user.accessToken,
          clientId: session.user.clientId,
          startDate: request.startDate,
          endDate: request.endDate,
          maxItems: request.maxItems || 2000
        });

        sendResponse({
          success: true,
          user: session.user,
          total: items.length,
          items: items
        });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Asynchronous response
  }
});
