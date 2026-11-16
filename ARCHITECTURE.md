# 🏛️ System Architecture — TraktLens

**Versi**: `v0.2.0`  
**Arsitektur**: Monorepo (Chrome Extension Manifest V3 Background Service Worker + Next.js App Router)  
**Database**: Neon Serverless PostgreSQL & Local JSON Storage Fallback  

---

## 1. Diagram Arsitektur Tingkat Tinggi

```mermaid
flowchart TD
    subgraph ClientBrowser["Browser Pengguna"]
        TabTrakt["app.trakt.tv<br/>(Sesi Login Pengguna)"]
        ExtContent["Content Script<br/>(Baca Sesi OIDC LocalStorage)"]
        ExtPopup["Extension Popup UI<br/>(Controller & Live State Viewer)"]
        ExtBG["Background Service Worker<br/>(background.js Mandiri & Toolbar Badge)"]
        WebDashboard["TraktLens Web Dashboard<br/>(Next.js App Router)"]
    end

    subgraph TraktCloud["Trakt.tv Official Cloud"]
        TraktAPI["apiz.trakt.tv/users/me/history<br/>(Bearer Token Authorized)"]
    end

    subgraph VercelApp["Vercel Serverless Platform"]
        APISync["POST /api/sync<br/>(Parser & Atomic Upsert Handler)"]
        APIHistory["GET /api/history<br/>(Filter, Aggregator, Years, Fun Facts)"]
    end

    subgraph StorageLayer["Data Storage Engine"]
        NeonDB[("Neon Serverless PostgreSQL<br/>(Primary Cloud)")]
        LocalJSON[("Local File Engine<br/>(.data/history.json Atomic)")]
    end

    ExtPopup -->|1. Kirim START_SYNC| ExtBG
    ExtBG -->|2. Request GET_SESSION| ExtContent
    ExtContent -->|Baca Token| TabTrakt
    ExtContent -->|Kembalikan Credentials| ExtBG
    ExtBG -->|3. Fetch Paginated History| TraktAPI
    TraktAPI -->|4. Return Data Trakt| ExtBG
    ExtBG -->|5. Update Progress ke Storage & Badge| ExtPopup
    ExtBG -->|6. POST /api/sync (Chunks 150 item)| APISync

    APISync -->|Kondisi DATABASE_URL Terisi| NeonDB
    APISync -->|Kondisi Offline / Lokal| LocalJSON

    WebDashboard -->|GET /api/history| APIHistory
    APIHistory -->|Query Filtered Data| NeonDB
    APIHistory -->|Read File Filtered Data| LocalJSON
    APIHistory -->|Return Aggregated Stats & Items| WebDashboard
```

---

## 2. Alur Data & Sequence Diagram

### 2.1 Alur Sinkronisasi Latar Belakang (Background Service Worker)

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna
    participant Pop as Popup Ekstensi
    participant BG as Background Service Worker
    participant CS as Content Script (app.trakt.tv)
    participant TAPI as apiz.trakt.tv
    participant Srv as Server /api/sync
    participant DB as Neon / Local DB

    User->>Pop: Klik "Ekstrak & Sinkronkan"
    Pop->>BG: chrome.runtime.sendMessage("START_SYNC", options)
    Pop-->>User: Tampilkan bar progress awal (Popup boleh ditutup!)
    BG->>CS: sendMessage("GET_SESSION")
    CS-->>BG: Return { accessToken, clientId, username }
    BG->>BG: Set syncState { isRunning: true, progress: 15% }
    BG->>BG: Perbarui Toolbar Badge ("15%")
    loop Setiap Halaman Paginasi Trakt
        BG->>TAPI: GET /users/me/history/?limit=100&page=N (Auth Bearer)
        TAPI-->>BG: Array Riwayat Tontonan
        BG->>BG: Update Toolbar Badge ("...%")
    end
    loop Setiap Chunk Upload (150 item)
        BG->>Srv: POST /api/sync { user, items: chunk }
        Srv->>DB: Atomic Upsert (ON CONFLICT (id) DO UPDATE)
        DB-->>Srv: OK (Tersimpan)
        Srv-->>BG: Response { success: true }
        BG->>BG: Update Toolbar Badge ("...%")
    end
    BG->>BG: Set syncState { isRunning: false, status: 'success' }
    BG->>BG: Set Toolbar Badge ("✓" hijau)
```

---

## 3. Komponen Utama

### 3.1 Chrome Extension (`/extension`)
* **`manifest.json`**: Manifest V3 dengan host permissions `*://app.trakt.tv/*`, `*://apiz.trakt.tv/*`, `http://localhost:*/*`, dan `https://*.vercel.app/*`.
* **`background.js` (Service Worker)**:
  * Menjalankan seluruh proses ekstraksi dan pengunggahan data secara mandiri di latar belakang.
  * Tetap berjalan tanpa terputus ketika pop-up ditutup, tab berpindah, atau browser di-minimize.
  * Mengelola toolbar badge Chrome (`%`, `✓`, `!`) dan AbortController untuk pembatalan aman.
* **`content.js`**:
  * Menembus *sandbox* halaman untuk membaca sesi OIDC resmi Trakt yang tersimpan di `localStorage`.
* **`popup.js` & `popup.html`**:
  * Berperan sebagai UI controller dan live state viewer yang tersinkronisasi via `chrome.storage.local`.

### 3.2 Web Dashboard & API (`/web`)
* **Next.js 15 (App Router)**:
  * Serverless endpoints (`route.ts`) yang berjalan optimal di Vercel Functions.
  * Server-rendered & Client-hydrated UI untuk performa pemuatan instan.
* **API Endpoints**:
  * `POST /api/sync`: Menerima bulk upload dari ekstensi, mendukung CORS wildcard agar ekstensi bebas mengirim data tanpa error preflight.
  * `GET /api/history`: Mengembalikan data terfilter, kalkulasi metrik agregat, dan daftar `availableYears` dinamis.

---

## 4. Dual-Storage Engine Pattern

TraktLens mengadopsi pola arsitektur **Zero-Config Dual Storage**:
1. **Cloud Mode (Neon PostgreSQL)**:
   * Terdeteksi otomatis ketika variabel `process.env.DATABASE_URL` didefinisikan.
   * Menggunakan `@neondatabase/serverless` via HTTP/WebSockets, kompatibel dengan batas koneksi serverless di Vercel.
   * Skema database otomatis terinisialisasi (`CREATE TABLE IF NOT EXISTS`) pada request pertama.
2. **Local Fallback Mode (`.data/history.json`)**:
   * Aktif secara otomatis jika `DATABASE_URL` belum diset.
   * Menyimpan data langsung ke file JSON lokal di direktori server.
   * Menjamin bahwa pengguna dapat langsung menguji aplikasi secara offline tanpa perlu menginstall software database lokal.

---

## 5. Pertimbangan Keamanan & Skalabilitas

* **Keamanan Token**: Ekstensi tidak pernah menyimpan token Trakt ke storage permanen pihak ketiga. Token dibaca *on-demand* dari sesi aktif dan langsung digunakan untuk mengambil riwayat milik pengguna sendiri.
* **Idempotensi Sinkronisasi**: Menggunakan ID unik Trakt (`history_id`) sebagai Primary Key. Menyinkronkan ulang data yang sama tidak akan menyebabkan duplikasi data pada metrik.
* **CORS & Network Routing**: Endpoint `/api/sync` memiliki handler `OPTIONS` eksplisit dengan header `Access-Control-Allow-Origin: *` dan `Access-Control-Allow-Headers: Content-Type` untuk kompatibilitas lintas origin browser extension.
