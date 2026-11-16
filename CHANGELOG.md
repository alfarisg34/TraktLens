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
