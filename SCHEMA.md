# 📋 Data Schemas & API Specifications — TraktLens

**Versi**: `v0.1.0`  

---

## 1. Skema Basis Data Relasional (PostgreSQL / Neon)

```sql
-- Tabel Profil Pengguna Trakt
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,              -- Trakt User ID (contoh: "11527405")
    username VARCHAR(100) NOT NULL,          -- Username Trakt (contoh: "alfarisg34")
    avatar_url TEXT,                         -- URL Avatar Gravatar / Trakt
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabel Riwayat Tontonan Utama (Film & Episode)
CREATE TABLE IF NOT EXISTS watch_history (
    id BIGINT PRIMARY KEY,                   -- Trakt History ID unik (contoh: 14282090613)
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,               -- 'movie' | 'episode'
    watched_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Timestamp tonton presisi (ISO 8601 UTC)
    action VARCHAR(20) DEFAULT 'watch',      -- 'watch' | 'scrobble' | 'checkin'
    
    -- Metadata Judul
    title TEXT NOT NULL,                     -- Judul Film atau Nama Serial TV
    slug TEXT NOT NULL,                      -- Slug Trakt untuk tautan URL
    trakt_id INTEGER,                        -- Trakt Media ID
    imdb_id VARCHAR(30),                     -- IMDB ID (contoh: "tt15047880")
    tmdb_id INTEGER,                         -- TMDB ID
    
    -- Khusus Serial & Episode (NULL jika type = 'movie')
    show_title TEXT,                         -- Nama Serial TV
    show_slug TEXT,                          -- Slug Serial TV
    season_number INTEGER,                   -- Nomor Musim (contoh: 3)
    episode_number INTEGER,                  -- Nomor Episode (contoh: 17)
    episode_title TEXT,                      -- Judul Spesifik Episode
    
    -- Metrik Durasi & Visual
    runtime_minutes INTEGER DEFAULT 0,       -- Durasi tonton dalam menit (contoh: 146 atau 22)
    poster_url TEXT,                         -- URL Poster resmi Trakt CDN
    thumb_url TEXT,                          -- URL Screenshot episode / fanart film Trakt CDN
    genres JSONB DEFAULT '[]'::jsonb,        -- Array genre media (contoh: ["comedy", "drama"])
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indeks Performa Query
CREATE INDEX IF NOT EXISTS idx_watch_history_user_date ON watch_history(user_id, watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_watch_history_type ON watch_history(type);
CREATE INDEX IF NOT EXISTS idx_watch_history_year ON watch_history(EXTRACT(YEAR FROM watched_at));
```

---

## 2. Antarmuka TypeScript (`src/lib/db.ts`)

```typescript
export interface WatchItem {
  id: number | string;
  user_id: string;
  type: 'movie' | 'episode';
  watched_at: string;
  action: string;
  title: string;
  slug: string;
  trakt_id?: number | null;
  imdb_id?: string | null;
  tmdb_id?: number | null;
  show_title?: string | null;
  show_slug?: string | null;
  season_number?: number | null;
  episode_number?: number | null;
  episode_title?: string | null;
  runtime_minutes: number;
  poster_url?: string | null;
  thumb_url?: string | null;
  genres?: string[];
  created_at?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string | null;
  updated_at?: string;
}

export interface SummaryData {
  totalItems: number;
  movieCount: number;
  episodeCount: number;
  uniqueShowsCount: number;
  totalMinutes: number;
  formattedDuration: string;
  genresBreakdown: [string, number][];
}
```

---

## 3. Spesifikasi Kontrak API

### 3.1 `POST /api/sync`
Menerima payload ekspor dari ekstensi Chrome dan melakukan *upsert* ke penyimpanan aktif.

* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "user": {
    "userId": "11527405",
    "username": "alfarisg34",
    "avatarUrl": "https://secure.gravatar.com/avatar/..."
  },
  "items": [
    {
      "id": 14282090613,
      "watched_at": "2026-08-16T09:54:00.000Z",
      "action": "watch",
      "type": "movie",
      "movie": {
        "title": "Disclosure Day",
        "runtime": 146,
        "ids": { "slug": "disclosure-day-2026", "trakt": 1036433, "imdb": "tt15047880" },
        "images": {
          "poster": ["media.trakt.tv/movies/1036433/medium/poster.webp"],
          "fanart": ["media.trakt.tv/movies/1036433/medium/fanart.webp"]
        },
        "genres": ["science-fiction", "thriller"]
      }
    }
  ]
}
```
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "savedCount": 1,
  "mode": "neon",
  "total": 3001
}
```

---

### 3.2 `GET /api/history`
Mengambil data riwayat terfilter beserta kalkulasi metrik ringkasan dan daftar tahun yang tersedia.

* **Query Parameters**:
  * `startDate` (opsional): Tanggal awal (format `YYYY-MM-DD`).
  * `endDate` (opsional): Tanggal akhir (format `YYYY-MM-DD`).
  * `type` (opsional): `'all'` | `'movie'` | `'episode'`.
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "user": {
    "id": "11527405",
    "username": "alfarisg34",
    "avatar_url": "https://..."
  },
  "isNeon": false,
  "availableYears": [2026, 2025, 2024, 2023, 2022],
  "summary": {
    "totalItems": 3001,
    "movieCount": 314,
    "episodeCount": 2687,
    "uniqueShowsCount": 80,
    "totalMinutes": 122364,
    "formattedDuration": "84h 23j 24m",
    "genresBreakdown": [
      ["comedy", 1420],
      ["drama", 980],
      ["animation", 640]
    ]
  },
  "items": [ /* Array of WatchItem */ ]
}
```

---

## 4. Struktur File Penyimpanan Lokal (`web/.data/history.json`)

```json
{
  "user": {
    "id": "11527405",
    "username": "alfarisg34",
    "avatar_url": "https://secure.gravatar.com/avatar/...",
    "updated_at": "2026-11-16T14:00:00.000Z"
  },
  "items": [
    /* Koleksi WatchItem terurut dari watched_at terbaru ke terlama */
  ]
}
```
