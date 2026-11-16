# 🔍 TraktLens - Personal Watch History & Analytics

Sistem pelacakan dan analisis riwayat tontonan personal dari [Trakt.tv](https://app.trakt.tv) dengan desain antarmuka bergaya resmi Trakt (Dark Theme + Red Accent), terdiri dari:
1. **Chrome Extension (TraktLens Sync)**: Ekstraktor otomatis riwayat tontonan langsung dari sesi aktif Trakt.
2. **Next.js Web Dashboard (TraktLens Web)**: Ringkasan tontonan (jumlah film, serial, total durasi, jam tonton presisi, dan filter tanggal/tahun dinamis).
3. **Penyimpanan Fleksibel**: Otomatis menggunakan penyimpanan file lokal (`.data/history.json`), dan langsung beralih ke **Neon PostgreSQL** saat `DATABASE_URL` diisi.

---

## 📁 Struktur Proyek

```
trakt.tv-extention/
├── extension/             # Ekstensi Google Chrome (Manifest V3)
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   └── content.js
├── web/                   # Web Dashboard (Next.js 15 + Tailwind CSS)
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── sync/     # Endpoint POST untuk menerima data dari ekstensi
│   │   │   │   └── history/  # Endpoint GET data & filter
│   │   │   ├── globals.css
│   │   │   └── page.tsx      # Dashboard Trakt Style
│   │   └── lib/
│   │       └── db.ts         # Adaptor Neon PostgreSQL / Local File
│   └── .data/                # Penyimpanan lokal offline
└── README.md
```

---

## 🚀 Panduan Menjalankan

### 1. Menjalankan Web Dashboard (Lokal)
Masuk ke folder `web` dan jalankan server pengembangan:

```bash
cd web
npm run dev
```

Buka browser di **[http://localhost:3000](http://localhost:3000)**. Dashboard sudah berisi data contoh dan siap menerima sinkronisasi dari ekstensi!

---

### 2. Memasang Ekstensi di Chrome
1. Buka browser Google Chrome / Brave / Edge.
2. Buka halaman `chrome://extensions/`.
3. Aktifkan **Developer mode** (Mode pengembang) di pojok kanan atas.
4. Klik tombol **Load unpacked** (Muat ekstensi yang belum dibongkar).
5. Pilih folder: `C:\Me\Code\trakt.tv-extention\extension`.
6. Ekstensi **Trakt Watch Summary Sync** akan langsung aktif di toolbar browser Anda.

---

### 3. Cara Menggunakan Ekstensi untuk Sinkronisasi
1. Buka halaman [https://app.trakt.tv](https://app.trakt.tv) dan pastikan Anda sudah login.
2. Klik ikon ekstensi di toolbar browser.
3. Ekstensi akan otomatis mendeteksi username Anda (misal: `@alfarisg34`).
4. Pilih rentang waktu riwayat yang ingin diekstrak (contoh: *Semua*, *30 Hari*, atau *Kustom Tanggal*).
5. Klik **"Ekstrak & Sinkronkan"**.
6. Riwayat tontonan akan diekstrak langsung dari API Trakt (termasuk jam tonton presisi & durasi menit) dan diunggah ke Web Dashboard.

---

### 4. Menghubungkan ke Neon PostgreSQL (Opsional)
Jika ingin menggunakan database cloud Neon:
1. Buat database gratis di [neon.tech](https://neon.tech).
2. Salin *Connection string* PostgreSQL.
3. Buat berkas `web/.env.local`:
   ```env
   DATABASE_URL="postgres://username:password@ep-xxxx.neon.tech/neondb?sslmode=require"
   ```
4. Restart server Next.js. Web dashboard akan otomatis membuat tabel dan beralih ke mode **NeonDB Connected**.

---

### 5. Deploy ke Vercel
Aplikasi sudah terdeploy secara otomatis ke Vercel di domain produksi:
👉 **[https://trakt-lens.vercel.app](https://trakt-lens.vercel.app)**

1. Repositori GitHub: [alfarisg34/TraktLens](https://github.com/alfarisg34/TraktLens).
2. Root Directory disetel ke: `web`.
3. Database Neon PostgreSQL (`neon-aqua-park` di region Singapore `sin1`) telah terhubung secara otomatis ke Vercel via Storage integration.
4. Skema database tabel `users` dan `watch_history` telah berhasil dibuat dan siap menerima sinkronisasi data cloud.
5. Untuk menyinkronkan data langsung ke cloud, buka popup ekstensi Chrome dan ubah *Target Web Dashboard URL* menjadi:
   `https://trakt-lens.vercel.app`
