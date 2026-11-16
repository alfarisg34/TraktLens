# 🗄️ Database Architecture & Guide — TraktLens

**DBMS**: PostgreSQL (Hosted via [Neon Serverless](https://neon.tech))  
**Client Library**: `@neondatabase/serverless`  
**Fallback Engine**: File System JSON (`web/.data/history.json`)  
**Versi**: `v0.1.0`  

---

## 1. Desain & Filosofi Basis Data

TraktLens dirancang untuk mengelola ribuan riwayat tontonan personal secara efisien:
1. **Serverless-First**: Menggunakan driver Neon berbasis HTTP over WebSockets (`neon()`). Driver ini menghilangkan masalah *connection pool exhaustion* yang umumnya terjadi pada PostgreSQL tradisional saat diakses oleh fungsi Vercel Serverless yang bersifat *stateless* dan berskala horizontal secara dinamis.
2. **Idempotensi**: Operasi penulisan (*sync*) menggunakan klausa `ON CONFLICT (id) DO UPDATE` pada tabel `watch_history`. Pengguna dapat menyinkronkan data berkali-kali tanpa khawatir terjadinya duplikasi record.
3. **Zero-Configuration Fallback**: Jika variabel `DATABASE_URL` belum disediakan di environment, aplikasi tidak akan crash, melainkan otomatis beralih ke penyimpanan lokal `.data/history.json`.

---

## 2. Struktur Tabel & Relasi

```
 ┌──────────────────────┐         1 : N         ┌────────────────────────────────┐
 │        users         │───────────────────────│         watch_history          │
 ├──────────────────────┤                       ├────────────────────────────────┤
 │ id (PK, VARCHAR)     │                       │ id (PK, BIGINT) [Trakt ID]     │
 │ username (VARCHAR)   │                       │ user_id (FK -> users.id)       │
 │ avatar_url (TEXT)    │                       │ type ('movie' | 'episode')     │
 │ updated_at (TIMESTAMPTZ)                     │ watched_at (TIMESTAMPTZ)       │
 └──────────────────────┘                       │ action ('watch')               │
                                                │ title (TEXT)                   │
                                                │ slug (TEXT)                    │
                                                │ trakt_id, imdb_id, tmdb_id     │
                                                │ show_title, show_slug          │
                                                │ season_number, episode_number  │
                                                │ episode_title (TEXT)           │
                                                │ runtime_minutes (INTEGER)      │
                                                │ poster_url, thumb_url (TEXT)   │
                                                │ genres (JSONB)                 │
                                                │ created_at (TIMESTAMPTZ)       │
                                                └────────────────────────────────┘
```

---

## 3. Panduan Setup Neon PostgreSQL

1. **Buat Akun & Project di Neon**:
   * Kunjungi [https://neon.tech](https://neon.tech) dan login.
   * Buat project baru dengan nama `traktlens-db` (pilih region terdekat, misal: *Singapore / ap-southeast-1*).
2. **Ambil Connection String**:
   * Di dashboard Neon, salin *Connection string* (pilih mode *Pooled connection* atau *Direct*).
   * Format connection string:
     ```
     postgres://[user]:[password]@[endpoint].neon.tech/neondb?sslmode=require
     ```
3. **Pasang di Lingkungan Lokal**:
   * Buat berkas `web/.env.local`:
     ```env
     DATABASE_URL="postgres://username:password@ep-xyz.neon.tech/neondb?sslmode=require"
     ```
4. **Pasang di Vercel Production**:
   * Buka Dashboard Vercel $\rightarrow$ Proyek TraktLens $\rightarrow$ **Settings** $\rightarrow$ **Environment Variables**.
   * Tambahkan key `DATABASE_URL` dengan nilai connection string dari Neon.
   * Redeploy proyek jika diperlukan.

---

## 4. Inisialisasi Otomatis & Migrasi

TraktLens mengadopsi mekanisme *Self-Healing Schema*:
* Fungsi `initDbSchema()` di `src/lib/db.ts` mengeksekusi DDL `CREATE TABLE IF NOT EXISTS` dan `CREATE INDEX IF NOT EXISTS` setiap kali fungsi database pertama kali diakses.
* Tidak memerlukan *migration CLI* manual (seperti Prisma Migrate atau Drizzle Kit) untuk setup awal.

---

## 5. Pola Query & Optimasi Performa

### 5.1 Query Filter Dinamis yang Aman (SQL Injection-Proof)
Query filter tanggal dan tipe media memanfaatkan tagged template literal `@neondatabase/serverless` dengan casting type PostgreSQL yang aman:

```typescript
const items = (await sql`
  SELECT * FROM watch_history
  WHERE (${startDateParam}::timestamptz IS NULL OR watched_at >= ${startDateParam}::timestamptz)
    AND (${endDateParam}::timestamptz IS NULL OR watched_at <= ${endDateParam}::timestamptz)
    AND (${typeParam}::text IS NULL OR type = ${typeParam}::text)
  ORDER BY watched_at DESC
`) as WatchItem[];
```

### 5.2 Ekstraksi Tahun Dinamis yang Ringan
Untuk menampilkan tombol tahun dinamis di antarmuka, backend menjalankan agregasi cepat berkat indeks pada tahun tonton:

```typescript
const yearRows = await sql`
  SELECT DISTINCT EXTRACT(YEAR FROM watched_at)::integer AS year
  FROM watch_history
  ORDER BY year DESC
`;
```

---

## 6. Prosedur Pencadangan & Ekspor Data

1. **Data Lokal**: Berkas `web/.data/history.json` dapat disalin kapan saja sebagai arsip cadangan offline.
2. **Neon Cloud**: Neon menyediakan fitur *Instant Branching* dan *Point-in-Time Restore (PITR)* bawaan melalui dashboard Neon untuk mengembalikan data jika terjadi kesalahan manipulasi.
