# 📜 Changelog & Aturan Versi — TraktLens

Seluruh catatan pembaruan, peningkatan fitur, perbaikan bug, dan dokumentasi pada proyek **TraktLens** dicatat secara sistematis pada dokumen ini mengikuti standar Semantic Versioning (**SemVer**).

---

## 📐 Aturan Penomoran Versi (Semantic Versioning: X.Y.Z)

Format versi yang digunakan adalah **`vX.Y.Z`**:

```
        v X . Y . Z
          │   │   │
          │   │   └─── PATCH : Perbaikan bug, optimasi kecil, dan refactoring minor
          │   └─────── MINOR : Penambahan fitur baru yang backwards-compatible
          └─────────── MAJOR : Perubahan arsitektur besar / breaking changes
```

### 1. `MAJOR` (X.0.0)
* Ditingkatkan ketika ada perubahan arsitektur besar, perubahan skema database yang memerlukan migrasi destruktif, atau *breaking changes* pada API.
* **Status v0.x.x**: Saat ini proyek berada di **Versi 0 (`v0.1.0`)**, menandakan tahap rilis awal / beta. Versi `v1.0.0` akan dirilis saat fitur analitik lanjutan, grafik, dan kestabilan multi-user siap untuk publik.

### 2. `MINOR` (0.Y.0)
* Ditingkatkan ketika menambahkan fitur fungsional baru tanpa merusak kompatibilitas yang sudah ada.
* *Contoh*: Penambahan filter tahun dinamis, dukungan charting baru, atau penambahan endpoint analitik.

### 3. `PATCH` (0.0.Z)
* Ditingkatkan untuk perbaikan bug (*bugfix*), perbaikan visual antarmuka (*UI polish*), pembaruan styling CSS, perbaikan dokumentasi, atau optimasi dependensi.

---

## 🏷️ Kategori Tag Perubahan

Setiap catatan rilis dikelompokkan ke dalam label-label terstandarisasi:

| Tag | Warna Badge | Deskripsi |
| :--- | :--- | :--- |
| **`FEAT`** | Hijau Emerald | Fitur atau kapabilitas fungsional baru |
| **`FIX`** | Merah / Jingga | Perbaikan bug, penanganan galat, atau *patch* keamanan |
| **`UI`** | Ungu / Indigo | Peningkatan desain antarmuka, tata letak, atau animasi |
| **`DOCS`** | Biru | Penambahan atau pembaruan dokumentasi teknis |
| **`PERF`** | Kuning Amber | Optimasi kecepatan pemuatan, query database, atau build |
| **`TEST`** | Teal | Pengujian build, verifikasi regresi, dan validasi data |

---

## 🚀 Riwayat Rilis Resmi

### [v0.3.0] — 2026-11-17
> **Highlight & Rekap Judul (1 Card per Series + Film Normal), Format Tampilan Multi-Mode (Per Hari, Semua Log, Rekap Judul), dan Metadata Episode pada Jejak & Milestone Akun**

#### `FEAT` (Fitur Baru)
* **Highlight & Rekap Judul (1 Card per Series + Film Normal)**:
  * Fitur baru untuk melihat ringkasan tontonan dalam rentang waktu yang dipilih, di mana seluruh episode dari satu serial televisi/anime otomatis dikelompokkan ke dalam **1 kartu per judul utama** (misalnya puluhan episode *Mushoku Tensei* digabung menjadi satu kartu informatif).
  * **Informasi Agregat Komprehensif**: Menampilkan badge `📺 Series` ungu, jumlah episode ditonton, total durasi tontonan (jam & menit), daftar musim yang ditonton (misal: *Musim 1, 2, 3*), dan waktu tontonan episode paling mutakhir.
  * **Accordion Rincian Episode Interaktif**: Kartu series dilengkapi tombol interaktif `Daftar X Episode Ditonton ▼` yang dapat dibuka untuk menampilkan seluruh episode yang ditonton dalam periode tersebut lengkap dengan nomor musim, nomor episode, judul episode, dan tanggal tonton.
  * **Film Tampil Normal**: Tontonan film tetap tersaji normal (1 kartu per film) dengan badge `🎬 Film` emerald, durasi menit, dan label jika film tersebut di-rewatch (`2x tonton`).
  * **Sub-Filter & Pengurutan Khusus Rekap**: Dilengkapi tab filter instan (*Semua*, *Series Saja*, *Film Saja*) serta selector pengurutan (*Terbaru Ditonton*, *Episode/Tontonan Terbanyak*, *Durasi Terlama*, dan *Alfabetis A-Z*).
  * **Banner Notifikasi Cerdas**: Muncul banner highlight di atas daftar saat berada di mode kronologis yang merangkum jumlah judul unik dan menyediakan tombol pintas `[ Buka Rekap Judul → ]`.
* **Tiga Pilihan Format Tampilan (Multi-Mode Switcher)**:
  * **`📅 Per Hari`**: Tampilan default yang membagi riwayat secara kronologis per tanggal/hari.
  * **`⊞ Semua Log`**: Tampilan riwayat penuh berkelanjutan tanpa pemisah header tanggal, dengan badge waktu cerdas yang menampilkan tanggal singkat (misal: `15 Nov • 01.33 WIB`).
  * **`✨ Rekap Judul`**: Tampilan highlight terkelompok (1 kartu per series + film).
  * Tersedia langsung di toolbar samping pencarian dan panel slide-over Filter Drawer, dengan preferensi tersimpan otomatis di `localStorage` browser.
* **Penyertaan Metadata Episode Lengkap pada Jejak & Milestone Akun**:
  * Widget *Jejak & Milestone Akun* kini menampilkan rincian serial jika tontonan tertua atau terbaru berjenis episode: mencakup Judul Serial, Musim, Episode, dan Judul Episode (misal: `Season 3 • Eps 7 - Phase Four`), bukan hanya nama serial dan label generik.
  * Pembaruan endpoint backend `GET /api/history` untuk menyertakan `season_number`, `episode_number`, `episode_title`, dan `show_title` pada objek `timelineMilestone`.

#### `UI` (Peningkatan Antarmuka)
* Tiga tombol switcher tersegmentasi di toolbar utama berdesain dark-theme Trakt otentik.
* Desain kartu rekap media 16:9 yang seimbang dan responsif dari smartphone hingga desktop.
* Pembaruan badge versi sistem menjadi `v0.3.0`.

#### `DOCS` (Dokumentasi)
* Pembaruan dokumentasi teknis `CHANGELOG.md`, `PRD.md`, `README.md`, dan antarmuka `/changelog`.

#### `TEST` (Pengujian & Validasi)
* Verifikasi kompilasi `npm run build` Next.js 16 berhasil 100% tanpa galat TypeScript atau linting.

---

### [v0.2.0] — 2026-11-16
> **Background Service Worker, Bento Grid Fakta Unik & Rekor Tontonan, Toggle Ranking Serial, dan Branding Logo TraktLens**

#### `FEAT` (Fitur Baru)
* **Background Service Worker Mandiri (`extension/background.js`)**:
  * Seluruh proses ekstraksi dari Trakt API dan pengunggahan data chunk ke Web Dashboard kini berjalan 100% di latar belakang via Chrome Extension Manifest V3 Service Worker.
  * Proses sinkronisasi kebal terhadap penutupan popup, perpindahan tab, maupun minimize browser.
  * **Indikator Badge Toolbar Chrome**: Menampilkan persentase progress live (`%`) di toolbar, tanda centang hijau (`✓`) saat tuntas, dan tanda seru (`!`) jika terjadi kendala.
  * **Sinkronisasi State Dua Arah**: UI pop-up membaca progress langsung dari `chrome.storage.local` dan mendengarkan event `chrome.storage.onChanged`.
  * **Tombol Pembatalan (Abort Controller)**: Pengguna dapat membatalkan proses yang sedang berjalan kapan saja secara aman.
* **Fakta Unik & Rekor Tontonan (Bento Grid 10 Kartu)**:
  * Pemisahan kartu ekstrim film menjadi dua kartu simetris 3-item: **Top 3 Film Terpanjang** dan **Top 3 Film Terpendek** dilengkapi poster, durasi, dan genre.
  * **Toggle Urutan Serial Terfavorit**: Pengguna dapat beralih ranking antara **Jumlah Episode Terbanyak** (misal *The Big Bang Theory* 280 ep) dan **Total Waktu Terlama** (misal *The Flash* 92j, *The Rookie* 90j), dilengkapi badge Juara #1 dan progress bar relatif.
  * **Filter Rekor Tahun In-Section**: Tab pil horizontal tahunan instan (`Semua Waktu`, `2026`, `2025`, `2024`, `2023`, `2022`, `2021`, `2011`) dengan counter tontonan dan banner Year-in-Review.
  * **Analisis Binge Realistis**: Membedakan hari maraton tontonan nyata (durasi $\le$ 24 jam) dengan arsip impor bulk.
  * **Metrik Komprehensif**: Rasio film vs episode (durasi & kuantitas), distribusi hari produktif, dan zona prime-time jam tonton (WIB).

#### `FIX` (Perbaikan Bug & Stabilitas)
* **Penyelesaian Masalah File Locking Windows di `db.ts`**:
  * Memperbaiki galat `HTTP 500 UNKNOWN: unknown error, open 'history.json'` saat ekstensi mengirim data tontonan berurutan.
  * Menerapkan teknik *Atomic Temporary Write* (`.tmp_...` + atomic copy/replace) serta *Exponential Retry Backoff* hingga 15x percobaan.
* **Penanganan Update Riwayat Tontonan Trakt**:
  * Menyinkronkan pembaruan tanggal tontonan historis (misal film *In Time* ke 7 Desember 2022 pukul 15.17 WIB) dan membersihkan ID duplikat lama Trakt.

#### `UI` (Antarmuka & Branding)
* **Branding Logo & Favicon Resmi TraktLens**:
  * Menggantikan favicon default Next.js (`N` hitam) pada browser tab dengan logo resmi TraktLens (kotak merah berhuruf **T** putih menyala) pada `app/icon.png`, `apple-icon.png`, dan `favicon.ico`.

---

### [v0.1.0] — 2026-11-16
> **Inisialisasi TraktLens: Ekstensi Manifest V3, Web Dashboard Dark Mode Trakt, dan Filter Tahun Dinamis**

#### `FEAT` (Fitur Baru)
* **Ekstensi Chrome Manifest V3 (TraktLens Sync)**:
  * Otomatis membaca sesi aktif pengguna dari kunci `localStorage` OIDC resmi Trakt (`oidc.user:https://auth.trakt.tv:...`).
  * Mengambil riwayat tontonan langsung dari endpoint internal Trakt `https://apiz.trakt.tv/users/me/history/` dengan paginasi 100 item/halaman.
  * Menangkap data krusial yang tersembunyi dari kartu UI Trakt: **jam tonton presisi (`watched_at`)** dan **durasi tontonan menit (`runtime`)**.
  * Pengiriman data bulk ke dashboard web target (`POST /api/sync`) dengan bar progress visual.
* **Dual-Storage Engine (Neon PostgreSQL & Local JSON Fallback)**:
  * Dukungan otomatis database cloud **Neon Serverless PostgreSQL** via `@neondatabase/serverless` saat `DATABASE_URL` tersedia.
  * Fallback otomatis ke penyimpanan lokal `.data/history.json` saat berjalan offline tanpa konfigurasi.
  * Klausa `ON CONFLICT (id) DO UPDATE` untuk mencegah duplikasi data riwayat saat sinkronisasi berulang.
* **Filter Periode & Preset Tahun Dinamis**:
  * Otomatis mengekstrak tahun-tahun unik dari riwayat data yang tersimpan (`2026`, `2025`, `2024`, `2023`, `2022`).
  * Menyajikan tombol preset waktu instan (*Semua*, *7 Hari*, *30 Hari*, dan masing-masing *Tahun* yang terdeteksi).
  * Pemilihan tanggal kustom (*Start Date* & *End Date*) dan pencarian judul film/serial secara real-time.

#### `UI` (Antarmuka & Pengalaman Pengguna)
* **Desain Kloning Trakt.tv**:
  * Palet warna otentik: background `#090c13`, kartu `#121622`, border `#1d2537`, dan aksen merah Trakt `#ed1c24`.
  * Grid kartu media berorientasi 16:9 sesuai tampilan riwayat Trakt Web.
  * Tag waktu mengambang dengan efek *frosted glass* di atas cover (misal: `16.54 WIB` dan durasi `146 min`).
  * Empat kartu metrik ringkasan: Lama Menonton (hari/jam/menit), Jumlah Film, Jumlah Episode (dari total Serial TV), dan Total Tontonan.

#### `DOCS` (Dokumentasi)
* Penerbitan suite dokumentasi lengkap:
  * `PRD.md`: Spesifikasi kebutuhan produk dan target rilis.
  * `DESIGN.md`: Pedoman desain antarmuka, color tokens, dan spesifikasi komponen.
  * `ARCHITECTURE.md`: Diagram sistem, sequence sinkronisasi, dan dual-storage pattern.
  * `TECH_STACK.md`: Inventaris teknologi Next.js, Tailwind v4, NeonDB, dan Ekstensi.
  * `SCHEMA.md`: Skema database relasional PostgreSQL, JSON storage, dan tipe TypeScript.
  * `DATABASE.md`: Panduan pengelolaan database Neon dan pola query SQL aman.
  * `AGENTS.md`: Aturan operasional wajib untuk AI coding agents.
  * `CHANGELOG.md`: Tata kelola versi SemVer `X.Y.Z` dan log pembaruan resmi.

#### `TEST` (Verifikasi & Pengujian)
* Berhasil memverifikasi sinkronisasi nyata **3.001 item** riwayat tontonan Trakt pengguna (mencakup 5 tahun tontonan: 2022–2026).
* Kompilasi `npm run build` Next.js 16 berhasil dengan kode keluar 0 dan bebas galat TypeScript.
