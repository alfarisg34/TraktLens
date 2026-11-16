# 🤖 AGENTS.md — Panduan AI Agent untuk TraktLens

Berkas ini adalah panduan operasional wajib bagi AI coding agent (Antigravity, Cursor, Claude Code, Copilot, Codex) yang berinteraksi, memodifikasi, atau memperluas basis kode **TraktLens**.

---

## 1. Ikhtisar & Arsitektur Monorepo

Repository ini menggunakan struktur monorepo terpisah:
* **`/extension`**: Ekstensi Chrome (Manifest V3) berbasis Vanilla JavaScript murni (ES2022). **JANGAN** menambahkan build step rumit, Webpack, atau framework frontend berat ke folder ini kecuali secara eksplisit diminta oleh pengguna.
* **`/web`**: Web Dashboard berbasis Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, dan `@neondatabase/serverless`.

---

## 2. Aturan Emas Pengembangan (Golden Rules)

1. **Jaga Prinsip Dual-Storage**:
   * Setiap modifikasi pada modul database di `web/src/lib/db.ts` **HARUS** mempertahankan fungsi penyimpanan ganda:
     * Mode Neon PostgreSQL (`process.env.DATABASE_URL` aktif).
     * Mode Fallback File Lokal (`.data/history.json`).
   * Jangan pernah membuat perubahan yang menyebabkan web gagal berjalan jika `DATABASE_URL` bernilai `undefined`.

2. **Tailwind CSS v4 & Turbopack Compatibility**:
   * Proyek menggunakan Tailwind CSS v4 dengan Turbopack.
   * Konfigurasi di `web/next.config.ts` **HARUS** mempertahankan blok rule:
     ```typescript
     turbopack: {
       rules: {
         "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" }
       }
     }
     ```
   * Jika blok ini dihapus, utility class Tailwind tidak akan terkompilasi!

3. **Verifikasi Build Wajib Sebelum Selesai**:
   * Setelah melakukan perubahan kode pada folder `web`, agen **WAJIB** menjalankan pengujian kompilasi:
     ```bash
     cd web && npm run build
     ```
   * Pastikan build berstatus exit code `0` tanpa galat TypeScript atau linting.

4. **Keamanan & Privasi Sesi**:
   * Ekstensi membaca sesi dari `localStorage` pengguna di `app.trakt.tv`. Jangan pernah mengirim data sesi ke server pihak ketiga selain endpoint dashboard pengguna (`/api/sync`).
   * Jangan pernah menyimpan atau melakukan commit berkas `.env` atau kredensial rahasia ke repositori Git.

---

## 3. Konvensi Gaya Kode & Desain

* **Warna & Tema**:
  * Gunakan palet resmi Trakt: Latar `#090c13`, kartu `#121622`, border `#1d2537`, teks `#f0f3f8`, aksen merah Trakt `#ed1c24`.
  * Rujuk [DESIGN.md](file:///c:/Me/Code/trakt.tv-extention/DESIGN.md) untuk pedoman desain lengkap.
* **Format Tanggal & Waktu**:
  * Selalu gunakan format waktu lokal Indonesia (`id-ID`) dengan zona waktu `WIB` untuk antarmuka pengguna akhir.
* **Idempotensi**:
  * Gunakan ID unik riwayat Trakt (`id` pada tabel `watch_history`) untuk mencegah duplikasi.

---

## 4. Struktur File Utama

```
trakt.tv-extention/
├── extension/
│   ├── manifest.json       # Manifest V3 konfigurasi ekstensi
│   ├── content.js          # Ekstraktor sesi OIDC & pemanggil API Trakt
│   ├── popup.html          # UI popup ekstensi
│   ├── popup.css           # Styling popup Trakt dark-theme
│   └── popup.js            # Logika trigger & komunikasi pesan ekstensi
├── web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── sync/route.ts      # Endpoint penerima sinkronisasi POST
│   │   │   │   └── history/route.ts   # Endpoint riwayat & metrik GET
│   │   │   ├── globals.css            # Tailwind CSS v4 & custom tokens
│   │   │   ├── layout.tsx             # Root layout & metadata TraktLens
│   │   │   └── page.tsx               # Komponen Dashboard utama
│   │   └── lib/
│   │       └── db.ts                  # Adaptor Neon PostgreSQL / Local File
│   ├── .data/
│   │   └── history.json               # Tempat data tontonan lokal offline
│   └── next.config.ts                 # Konfigurasi Turbopack & remote image
├── PRD.md                  # Spesifikasi kebutuhan produk
├── DESIGN.md               # Pedoman desain UI/UX & tokens
├── ARCHITECTURE.md         # Diagram arsitektur & sequence
├── TECH_STACK.md           # Daftar dependensi & rasionalisasi teknologi
├── SCHEMA.md               # Skema PostgreSQL & interface TypeScript
├── DATABASE.md             # Panduan pengelolaan database Neon
├── CHANGELOG.md            # Catatan riwayat rilis sistem
└── README.md               # Panduan pengguna & instalasi
```
