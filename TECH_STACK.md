# 🛠️ Tech Stack & Dependencies — TraktLens

**Versi**: `v0.1.0`  
**Monorepo Runtime**: Node.js `v24+` (Kompatibel Node `18+` / `20+` / `22+`)  

---

## 1. Ringkasan Ekosistem Teknologi

| Domain | Teknologi | Versi | Alasan Pemilihan |
| :--- | :--- | :--- | :--- |
| **Framework Web** | [Next.js](https://nextjs.org/) | `16.4.6` (App Router) | Standar industri untuk React fullstack, performa SSR/SSG tinggi, siap deploy 1-klik di Vercel. |
| **UI Library** | [React](https://react.dev/) | `19.3.0` | Library antarmuka reaktif modern dengan dukungan komponen interaktif mutakhir. |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `4.3.3` | Utility-first CSS generasi terbaru dengan arsitektur compiler `@tailwindcss/turbopack` yang ultra cepat. |
| **Bahasa Pemrograman** | [TypeScript](https://www.typescriptlang.org/) | `^5.0` | Menjamin type safety untuk payload API Trakt dan skema data database. |
| **Database Cloud** | [Neon Serverless Postgres](https://neon.tech/) | `@neondatabase/serverless ^1.2.1` | Database PostgreSQL serverless dengan koneksi HTTP instan tanpa connection-pooling exhaustion di serverless lambdas. |
| **Penyimpanan Lokal** | Node.js File System (`fs`) | Native | Mesin fallback JSON tanpa ketergantungan software eksternal untuk pengujian lokal instan. |
| **Iconography** | [Lucide React](https://lucide.dev/) | `^1.73.0` | Koleksi ikon SVG yang konsisten, bersih, dan berbobot ringan. |
| **Date Utility** | [date-fns](https://date-fns.org/) | `^4.4.0` | Library manipulasi dan kalkulasi tanggal modular tanpa overhead timezone yang rumit. |
| **Ekstensi Browser** | Chrome Extensions API | Manifest `V3` | Standar keamanan terbaru dari Google Chrome untuk ekstensi browser modern. |
| **Bundler & Compiler** | Turbopack | Native Next.js | Engine bundler berbasis Rust berkecepatan tinggi pengganti Webpack. |

---

## 2. Rincian Paket `web/package.json`

### Production Dependencies
```json
{
  "dependencies": {
    "@neondatabase/serverless": "^1.2.1",
    "date-fns": "^4.4.0",
    "lucide-react": "^1.73.0",
    "next": "16.4.6",
    "react": "19.3.0",
    "react-dom": "19.3.0"
  }
}
```

### Development Dependencies
```json
{
  "devDependencies": {
    "@tailwindcss/turbopack": "4.3.3",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.4.6",
    "tailwindcss": "4.3.3",
    "typescript": "^5"
  }
}
```

---

## 3. Ekosistem Ekstensi Browser (`/extension`)

* **Teknologi**: Vanilla Modern JavaScript (ES2022).
* **Alasan Tidak Menggunakan Framework di Ekstensi**:
  * Menghindari overhead bundle size.
  * Loading popup instan (< 10ms).
  * Menghindari risiko pelanggaran *Content Security Policy* (CSP) Manifest V3.
  * Dependensi nol (`zero external dependencies`).

---

## 4. Alasan Pemilihan Arsitektur & Perbandingan

### Mengapa Neon PostgreSQL?
* Menggunakan koneksi berbasis HTTP/WebSockets (`neon()`), sehingga tidak rentan terhadap batasan *connection pool* yang sering menjadi kendala pada database SQL biasa di lingkungan serverless (Vercel Functions).
* Menyediakan paket *Free Tier* yang sangat murah hati untuk proyek personal.

### Mengapa Next.js App Router?
* Memungkinkan penyatuan frontend dan backend API dalam satu codebase (`/web`).
* Endpoint `/api/sync` dan `/api/history` berjalan sebagai *serverless functions* terisolasi yang hanya mengonsumsi sumber daya saat dipanggil.
