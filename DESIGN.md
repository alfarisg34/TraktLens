# 🎨 Design System & UI Guidelines — TraktLens

**Platform**: Web Application & Chrome Extension Popup  
**Design Reference**: [Trakt.tv](https://app.trakt.tv) Official Client  
**Versi**: `v0.1.0`  

---

## 1. Filosofi Desain

TraktLens dirancang dengan filosofi **"Media-First Dark Aesthetic"**:
1. **Identitas Otentik Trakt**: Menghormati dan mengadopsi nuansa gelap modern khas Trakt.tv dengan aksen merah ikonik (`#ed1c24`).
2. **Keterbacaan Informasi Tinggi (*Glanceable Metrics*)**: Angka statistik (lama menonton, jumlah film, episode) disajikan dengan tipografi tegas, besar, dan kontras tinggi.
3. **Hirarki Visual Bertingkat**: Cover gambar adalah fokus utama, diperkaya dengan tag mengambang transparan (*frosted glass badges*) untuk jam tonton dan durasi menit yang tidak mengganggu komposisi visual poster/screenshot.

---

## 2. Palet Warna (Color Tokens)

```
┌────────────────────────────────────────────────────────┐
│  --trakt-bg: #090c13        (Latar Belakang Utama)     │
│  --trakt-card: #121622      (Permukaan Kartu/Panel)    │
│  --trakt-card-hover: #182030(Permukaan Hover)          │
│  --trakt-border: #1d2537    (Garis Batas Komponen)     │
│  --trakt-red: #ed1c24       (Aksen Utama Trakt)        │
│  --trakt-red-hover: #ff2a33 (Hover Tombol Primer)      │
│  --trakt-text: #f0f3f8      (Teks Judul / Putih Utama) │
│  --trakt-muted: #79889b     (Teks Keterangan / Muted)  │
└────────────────────────────────────────────────────────┘
```

### Warna Semantik & Kategori Media
* **Aksen Film**: `#10b981` (Emerald Green) — Digunakan untuk teks label `"Film"` dan lencana durasi menit.
* **Aksen Serial TV**: `#6366f1` (Indigo) — Digunakan untuk ikon metrik episode dan serial.
* **Aksen Waktu / Durasi**: `#ed1c24` (Trakt Red) — Digunakan untuk ikon jam tonton presisi.
* **Aksen Status Database**:
  * Neon Cloud: `#00e599` (Neon Green dengan background `rgba(0, 229, 153, 0.1)`).
  * Local Storage: `#60a5fa` (Soft Blue dengan background `rgba(59, 130, 246, 0.1)`).

---

## 3. Tipografi

* **Font Primer**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
* **Skala Tipografi**:
  * `Display / H1 Dashboard`: `16px` (Desktop) / `14px` (Mobile), Weight 700 / Bold, Letter-spacing `-0.02em`.
  * `Metric Values`: `28px - 32px`, Weight 800 / Extra Bold.
  * `Section Date Heading`: `14px`, Weight 700 / Bold, Capitalize.
  * `Card Title`: `13px`, Weight 700 / Bold, Single-line truncate (`ellipsis`).
  * `Card Subtitle`: `11px`, Weight 500 / Medium, Muted (`#7e8d9f`).
  * `Badges / Tags`: `10px - 11px`, Weight 700 / Bold.

---

## 4. Spesifikasi Komponen

### 4.1 Kartu Media Riwayat (`MediaCard`)
* **Aspek Rasio Cover**: `16:9` (Landscape).
* **Radius Sudut**: `12px` (`rounded-xl`).
* **Border**: `1px solid #1c2436` dengan transisi hover ke `#ed1c24/50`.
* **Efek Hover**: Mengangkat `-4px` (`hover:-translate-y-1`) dengan bayangan mendalam `box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6)`.
* **Badge Mengambang pada Cover**:
  * **Tag Jam Tonton (Kiri Atas)**: Latar belakang `rgba(0, 0, 0, 0.75)` dengan `backdrop-blur: 8px`, border tipis putih `rgba(255, 255, 255, 0.1)`, teks jam format 24 jam (misal: `16.54 WIB`).
  * **Tag Durasi (Kanan Bawah)**: Teks hijau emerald tebal (misal: `146 min` atau `22 min`).
  * **Tombol Trakt Direct Link (Kanan Atas)**: Tersembunyi secara default (`opacity: 0`), muncul halus saat kursor diarahkan ke kartu (`group-hover:opacity-100`).

### 4.2 Kartu Metrik Ringkasan (`StatCard`)
* Latar belakang `#121622` dengan ikon latar berukuran besar `48px` dan opasitas rendah `10%` di sudut kanan atas.
* Saat hover, ikon memancarkan cahaya halus `20%` sesuai warna aksen masing-masing kartu.

### 4.3 Bar Filter & Preset Tahun Dinamis
* **Container**: Kotak kompak `#0a0d14` dengan border `#1f283d` dan padding `4px`.
* **Tombol Preset Aktif**: Latar belakang solid `#ed1c24`, teks putih, dengan *glow shadow* halus `box-shadow: 0 0 10px rgba(237, 28, 36, 0.5)`.
* **Tombol Preset Non-Aktif**: Transparan dengan teks `#7e8d9f`, berubah menjadi putih saat di-hover.

---

## 5. Responsivitas & Layout Grids

| Breakpoint | Ukuran Layar | Kolom Grid Media | Kolom Grid Metrik |
| :--- | :--- | :--- | :--- |
| **Mobile** | `< 640px` | 1 Kolom penuh | 2 Kolom (2 baris) |
| **Tablet** | `640px - 768px` | 2 Kolom | 2 Kolom |
| **Laptop** | `768px - 1024px`| 3 Kolom | 4 Kolom sebaris |
| **Desktop**| `> 1024px` | 4 Kolom | 4 Kolom sebaris |

---

## 6. Gaya Desain Ekstensi Chrome (Popup)

* **Lebar Jendela**: `340px`.
* **Komposisi**: Header TraktLens dengan pil status login hijau/merah, input URL target, pilihan rentang waktu dropdown, tombol primer merah lebar, dan bar progress animasi saat proses sinkronisasi berlangsung.
