# 📄 Product Requirements Document (PRD) — TraktLens

**Nama Produk**: TraktLens  
**Versi Saat Ini**: `v0.1.0` (Fase Beta / Awal)  
**Status**: Aktif dalam Pengembangan  
**Owner**: `@alfarisg34`  
**Repository**: [https://github.com/alfarisg34/TraktLens](https://github.com/alfarisg34/TraktLens)  

---

## 1. Ringkasan Eksekutif & Latar Belakang

**TraktLens** adalah platform pelacak, ringkasan, dan visualisasi analitik personal untuk pengguna [Trakt.tv](https://app.trakt.tv). 

Di antarmuka standar Trakt.tv (terutama pengguna non-VIP), informasi riwayat tontonan disajikan secara terbatas:
* Jam tonton spesifik (*timestamp* presisi) tidak ditampilkan di kartu riwayat.
* Durasi menit (*runtime*) per episode atau film tidak tertera langsung pada kartu riwayat.
* Metrik agregasi fleksibel per rentang waktu (misalnya total durasi tontonan bulan ini, tahun ini, atau filter multi-tahun dinamis) hanya tersedia pada langganan berbayar Trakt VIP.

**TraktLens** memecahkan masalah ini dengan menyediakan arsitektur hibrida:
1. **Ekstensi Browser (Manifest V3)**: Mengekstrak riwayat tontonan langsung dari sesi aktif browser (memanfaatkan token sesi OIDC Trakt yang aman) tanpa mengharuskan pengguna mendaftarkan OAuth Developer App yang rumit.
2. **Web Dashboard Interaktif**: Menampilkan analitik menyeluruh (Total Jam/Hari Menonton, Jumlah Film, Jumlah Episode, Filter Multi-Tahun Dinamis, Pencarian Judul, serta Jam Tonton WIB & Durasi Menit per tayangan) dengan desain antarmuka gelap (*dark mode*) bertema resmi Trakt.tv.
3. **Penyimpanan Ganda**: Mendukung penyimpanan lokal instan (*Zero-Setup Offline Mode*) dan sinkronisasi cloud dengan **Neon Serverless PostgreSQL**.

---

## 2. Tujuan & Target Pengguna

### Target Pengguna
* Penikmat film dan serial TV yang aktif melacak tontonan mereka di Trakt.tv.
* Pengguna yang ingin melihat kilas balik (*recap / wrapped*) tontonan mereka kapan saja tanpa batasan VIP.
* Pengguna yang ingin mengarsipkan data tontonan secara independen dan meng-host dashboard personal di Vercel.

### Key Objectives & OKR
* **O1**: Ekstraksi riwayat tontonan dari Trakt.tv secara nir-hambatan (1-klik via ekstensi).
  * *KR 1.1*: Ekstraksi 3.000+ item riwayat selesai dalam waktu < 10 detik.
  * *KR 1.2*: Menangkap field kritis yang tersembunyi dari UI Trakt: `watched_at` (ISO timestamp) dan `runtime` (menit).
* **O2**: Dashboard analitik yang cepat, responsif, dan akurat.
  * *KR 2.1*: Filter dinamis per rentang tanggal dan per tahun secara instan tanpa reload halaman penuh.
  * *KR 2.2*: Keselarasan desain visual dengan Trakt Web minimal 95% (kesesuaian warna, typography, card layout).
* **O3**: Fleksibilitas deployment.
  * *KR 3.1*: Berjalan langsung di lokal tanpa konfigurasi awal.
  * *KR 3.2*: Siap di-deploy ke Vercel dengan integrasi Neon PostgreSQL dalam 1 langkah.

---

## 3. Fitur Utama & Kebutuhan Fungsional

### 3.1 Ekstensi Chrome (TraktLens Sync)
* **FR-EXT-01 (Auto Session Detection)**: Mendeteksi sesi aktif user di `app.trakt.tv` melalui pembacaan `localStorage` kunci OIDC (`oidc.user:https://auth.trakt.tv:...`).
* **FR-EXT-02 (Pilihan Rentang Waktu Ekstraksi)**: Menyediakan pilihan preset (Semua Riwayat, 30 Hari Terakhir, 90 Hari, 1 Tahun, atau Kustom Tanggal).
* **FR-EXT-03 (Batch Pagination Extractor)**: Mengambil data riwayat bertahap via API internal `https://apiz.trakt.tv/users/me/history/` dengan authorization bearer token pengguna.
* **FR-EXT-04 (Sync Payload Dispatcher)**: Mengirimkan hasil ekstraksi ke API Dashboard target (`POST /api/sync`) dengan indikator progress visual.
* **FR-EXT-05 (Target URL Switcher)**: Mengizinkan perubahan target URL dari `http://localhost:3000` ke domain Vercel publik pengguna.

### 3.2 Web Dashboard (TraktLens Web)
* **FR-WEB-01 (Statistik Ringkasan Agregat)**:
  * Total Lama Menonton (format terurai: `X Hari, Y Jam, Z Menit` dan total menit).
  * Total Film Ditonton (jumlah film berstatus rilis/selesai).
  * Total Episode Ditonton dan Jumlah Serial TV unik yang terlibat.
  * Total Aktivitas Keseluruhan.
* **FR-WEB-02 (Filter Dinamis & Preset Tahun)**:
  * Tombol Preset Waktu: *Semua*, *7 Hari*, *30 Hari*.
  * **Tombol Tahun Dinamis**: Otomatis mendeteksi tahun-tahun unik yang ada pada database (misal: *Tahun 2026*, *Tahun 2025*, *Tahun 2024*, dst.).
  * Input Rentang Tanggal Manual (*Start Date* & *End Date*).
  * Filter Tipe Media (*Semua*, *Hanya Film*, *Hanya Episode*).
  * Filter Pencarian Real-Time berdasarkan nama film, serial, atau judul episode.
* **FR-WEB-03 (Media Grid Grouped by Date)**:
  * Mengelompokkan tontonan berdasarkan tanggal lokal Indonesia (misal: "Minggu, 16 Agustus 2026").
  * Kartu cover aspek rasio 16:9 sesuai format riwayat Trakt Web.
  * Tag waktu jam tonton presisi lokal (misal: `16.54 WIB`).
  * Tag durasi tontonan (misal: `146 min` / `22 min`).
  * Badge musim & episode (`M3 • E17 - Judul Episode`) atau badge jenis media (`Film`).
  * Tag genre media (maksimal 3 genre per kartu).
  * Tombol aksi langsung ke halaman resmi Trakt.tv.
* **FR-WEB-04 (Halaman Changelog)**:
  * Menampilkan catatan rilis sistem resmi, breakdown perubahan berlabel (FEAT, FIX, UI, DOCS, TEST, PERF), dan aturan SemVer `X.Y.Z`.

---

## 4. Kebutuhan Non-Fungsional (NFR)

* **NFR-01 (Performa)**: Dashboard harus memuat dan merender 3.000+ item dalam < 1 detik pada koneksi internet standar berkat paginasi/filtering efisien.
* **NFR-02 (Keamanan & Privasi)**:
  * Ekstensi hanya membaca token sesi saat user menekan tombol sinkronisasi.
  * Tidak ada kata sandi yang disimpan atau dikirimkan ke server.
  * API route dilengkapi validasi payload ketat.
* **NFR-03 (Kompatibilitas)**:
  * Ekstensi kompatibel dengan Chrome Manifest V3 (Google Chrome, Microsoft Edge, Brave, Opera).
  * Web Dashboard sepenuhnya responsif dari layar smartphone (360px) hingga layar desktop ultra-wide (2560px).
* **NFR-04 (Reliabilitas Database)**:
  * Database cloud Neon PostgreSQL menggunakan koneksi pool serverless yang aman (`sslmode=require`).
  * Skema menggunakan klausa `ON CONFLICT (id) DO UPDATE` untuk mencegah duplikasi data riwayat Trakt saat sinkronisasi berulang.

---

## 5. Rencana Rilis & Versi

* **v0.1.0 (Versi Saat Ini)**:
  * Fondasi monorepo (`/extension` + `/web`).
  * Ekstraksi sesi OIDC Trakt & sinkronisasi bulk.
  * Dashboard Next.js dengan dark mode Trakt.
  * Filter dinamis per tahun & metrik agregasi.
  * Penyimpanan lokal offline & koneksi NeonDB.
* **v0.2.0 (Target Berikutnya)**:
  * Visualisasi grafik tren (Charts tontonan per hari/minggu & breakdown genre).
  * Ekspor data ke JSON / CSV.
  * Opsi tema kustom (Pure OLED Black vs Slate Trakt).
* **v1.0.0 (Target Stabil)**:
  * Fitur perbandingan tontonan tahun ke tahun (*Year-over-Year Comparison*).
  * Dukungan autentikasi multi-user publik dengan login Trakt OAuth resmi opsional.
