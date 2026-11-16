// src/lib/db.ts
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

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

const LOCAL_DATA_DIR = path.join(process.cwd(), '.data');
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, 'history.json');

function ensureLocalFile() {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_DATA_FILE)) {
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify({ user: null, items: [] }), 'utf-8');
  }
}

function readLocalData(): { user: UserProfile | null; items: WatchItem[] } {
  try {
    ensureLocalFile();
    const raw = fs.readFileSync(LOCAL_DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { user: null, items: [] };
  }
}

function writeLocalData(data: { user: UserProfile | null; items: WatchItem[] }) {
  ensureLocalFile();
  fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

let sqlClient: NeonQueryFunction<false, false> | null = null;

export function getDb() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
  if (dbUrl && !sqlClient) {
    sqlClient = neon(dbUrl);
  }
  return sqlClient;
}

export async function initDbSchema() {
  const sql = getDb();
  if (!sql) return;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(100) NOT NULL,
      avatar_url TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS watch_history (
      id BIGINT PRIMARY KEY,
      user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL,
      watched_at TIMESTAMP WITH TIME ZONE NOT NULL,
      action VARCHAR(20) DEFAULT 'watch',
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      trakt_id INTEGER,
      imdb_id VARCHAR(30),
      tmdb_id INTEGER,
      show_title TEXT,
      show_slug TEXT,
      season_number INTEGER,
      episode_number INTEGER,
      episode_title TEXT,
      runtime_minutes INTEGER DEFAULT 0,
      poster_url TEXT,
      thumb_url TEXT,
      genres JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
}

export async function saveSyncData(user: UserProfile, items: WatchItem[]) {
  const sql = getDb();

  if (sql) {
    await initDbSchema();
    // Upsert User
    await sql`
      INSERT INTO users (id, username, avatar_url, updated_at)
      VALUES (${user.id}, ${user.username}, ${user.avatar_url || null}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
    `;

    // Upsert Items with batch concurrency to stay well within serverless timeouts
    const BATCH_CONCURRENCY = 25;
    for (let i = 0; i < items.length; i += BATCH_CONCURRENCY) {
      const batch = items.slice(i, i + BATCH_CONCURRENCY);
      await Promise.all(batch.map(item => sql`
        INSERT INTO watch_history (
          id, user_id, type, watched_at, action,
          title, slug, trakt_id, imdb_id, tmdb_id,
          show_title, show_slug, season_number, episode_number, episode_title,
          runtime_minutes, poster_url, thumb_url, genres
        ) VALUES (
          ${item.id}, ${user.id}, ${item.type}, ${item.watched_at}, ${item.action || 'watch'},
          ${item.title}, ${item.slug}, ${item.trakt_id || null}, ${item.imdb_id || null}, ${item.tmdb_id || null},
          ${item.show_title || null}, ${item.show_slug || null}, ${item.season_number || null}, ${item.episode_number || null}, ${item.episode_title || null},
          ${item.runtime_minutes || 0}, ${item.poster_url || null}, ${item.thumb_url || null}, ${JSON.stringify(item.genres || [])}
        )
        ON CONFLICT (id) DO UPDATE SET
          watched_at = EXCLUDED.watched_at,
          runtime_minutes = EXCLUDED.runtime_minutes,
          poster_url = EXCLUDED.poster_url,
          thumb_url = EXCLUDED.thumb_url;
      `));
    }

    return { mode: 'neon', count: items.length };
  } else {
    // Local File Fallback
    const current = readLocalData();
    const itemMap = new Map<string, WatchItem>();
    
    // Existing items
    current.items.forEach(it => itemMap.set(String(it.id), it));
    // New items
    items.forEach(it => itemMap.set(String(it.id), it));

    const updatedItems = Array.from(itemMap.values()).sort(
      (a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime()
    );

    writeLocalData({
      user,
      items: updatedItems,
    });

    return { mode: 'local', count: items.length, total: updatedItems.length };
  }
}

export interface HistoryFilters {
  startDate?: string;
  endDate?: string;
  type?: string;
  genre?: string;
  minRuntime?: number;
  maxRuntime?: number;
  sort?: string;
}

export async function getWatchHistory(filters?: HistoryFilters) {
  const sql = getDb();

  if (sql) {
    await initDbSchema();
    const startDateParam = filters?.startDate ? new Date(filters.startDate).toISOString() : null;
    const endDateParam = filters?.endDate ? new Date(filters.endDate).toISOString() : null;
    const typeParam = filters?.type && filters.type !== 'all' ? filters.type : null;
    const genreParam = filters?.genre && filters.genre !== 'all' ? filters.genre : null;
    const minRuntimeParam = typeof filters?.minRuntime === 'number' ? filters.minRuntime : null;
    const maxRuntimeParam = typeof filters?.maxRuntime === 'number' ? filters.maxRuntime : null;

    const userRows = await sql`SELECT * FROM users LIMIT 1`;
    const yearRows = await sql`
      SELECT DISTINCT EXTRACT(YEAR FROM watched_at)::integer AS year
      FROM watch_history
      ORDER BY year DESC
    `;
    const availableYears = yearRows.map((r: any) => r.year).filter((y: any) => typeof y === 'number' && !isNaN(y));

    // Dynamic sorting
    let orderBy = sql`ORDER BY watched_at DESC`;
    if (filters?.sort === 'oldest') {
      orderBy = sql`ORDER BY watched_at ASC`;
    } else if (filters?.sort === 'runtime_desc') {
      orderBy = sql`ORDER BY runtime_minutes DESC, watched_at DESC`;
    } else if (filters?.sort === 'runtime_asc') {
      orderBy = sql`ORDER BY runtime_minutes ASC, watched_at DESC`;
    }

    const items = (await sql`
      SELECT * FROM watch_history
      WHERE (${startDateParam}::timestamptz IS NULL OR watched_at >= ${startDateParam}::timestamptz)
        AND (${endDateParam}::timestamptz IS NULL OR watched_at <= ${endDateParam}::timestamptz)
        AND (${typeParam}::text IS NULL OR type = ${typeParam}::text)
        AND (${genreParam}::text IS NULL OR genres::text ILIKE '%' || ${genreParam} || '%')
        AND (${minRuntimeParam}::integer IS NULL OR runtime_minutes >= ${minRuntimeParam}::integer)
        AND (${maxRuntimeParam}::integer IS NULL OR runtime_minutes <= ${maxRuntimeParam}::integer)
      ${orderBy}
    `) as WatchItem[];

    // Extract available genres from full dataset
    const genreRows = await sql`
      SELECT DISTINCT jsonb_array_elements_text(genres) as genre
      FROM watch_history
      WHERE genres IS NOT NULL AND jsonb_array_length(genres) > 0
      ORDER BY genre ASC
    `;
    const availableGenres = genreRows.map((r: any) => r.genre).filter(Boolean);

    return {
      user: userRows[0] || null,
      items,
      availableYears,
      availableGenres,
      isNeon: true
    };
  } else {
    const data = readLocalData();
    const availableYears = Array.from(
      new Set(data.items.map(it => new Date(it.watched_at).getFullYear()))
    ).filter(y => typeof y === 'number' && !isNaN(y)).sort((a, b) => b - a);

    const genreSet = new Set<string>();
    data.items.forEach(it => {
      if (Array.isArray(it.genres)) it.genres.forEach(g => genreSet.add(g));
    });
    const availableGenres = Array.from(genreSet).sort();

    let items = data.items;

    if (filters?.startDate) {
      const start = new Date(filters.startDate).getTime();
      items = items.filter(it => new Date(it.watched_at).getTime() >= start);
    }
    if (filters?.endDate) {
      const end = new Date(filters.endDate).getTime();
      items = items.filter(it => new Date(it.watched_at).getTime() <= end);
    }
    if (filters?.type && filters.type !== 'all') {
      items = items.filter(it => it.type === filters.type);
    }
    if (filters?.genre && filters.genre !== 'all') {
      items = items.filter(it => Array.isArray(it.genres) && it.genres.includes(filters.genre!));
    }
    if (typeof filters?.minRuntime === 'number') {
      items = items.filter(it => (it.runtime_minutes || 0) >= filters.minRuntime!);
    }
    if (typeof filters?.maxRuntime === 'number') {
      items = items.filter(it => (it.runtime_minutes || 0) <= filters.maxRuntime!);
    }

    if (filters?.sort === 'oldest') {
      items.sort((a, b) => new Date(a.watched_at).getTime() - new Date(b.watched_at).getTime());
    } else if (filters?.sort === 'runtime_desc') {
      items.sort((a, b) => (b.runtime_minutes || 0) - (a.runtime_minutes || 0));
    } else if (filters?.sort === 'runtime_asc') {
      items.sort((a, b) => (a.runtime_minutes || 0) - (b.runtime_minutes || 0));
    } else {
      items.sort((a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime());
    }

    return {
      user: data.user,
      items,
      availableYears,
      availableGenres,
      isNeon: false
    };
  }
}
