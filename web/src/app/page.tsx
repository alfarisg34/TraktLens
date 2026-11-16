'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Film, 
  Tv, 
  Clock, 
  Calendar, 
  Filter, 
  RefreshCw, 
  Sparkles, 
  PlayCircle,
  ExternalLink,
  Layers,
  Database,
  Search,
  Star,
  MoreVertical
} from 'lucide-react';

interface WatchItem {
  id: number | string;
  type: 'movie' | 'episode';
  watched_at: string;
  title: string;
  slug: string;
  trakt_id?: number;
  show_title?: string;
  show_slug?: string;
  season_number?: number;
  episode_number?: number;
  episode_title?: string;
  runtime_minutes: number;
  poster_url?: string;
  thumb_url?: string;
  genres?: string[];
}

interface SummaryData {
  totalItems: number;
  movieCount: number;
  episodeCount: number;
  uniqueShowsCount: number;
  totalMinutes: number;
  formattedDuration: string;
  genresBreakdown: [string, number][];
}

export default function Dashboard() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [user, setUser] = useState<{ username: string; avatar_url?: string } | null>(null);
  const [isNeon, setIsNeon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Filters
  const [preset, setPreset] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'episode'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const res = await fetch(`/api/history?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setSummary(data.summary);
        setUser(data.user);
        setIsNeon(data.isNeon);
        if (data.availableYears && data.availableYears.length > 0) {
          setAvailableYears(data.availableYears);
        }
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [startDate, endDate, typeFilter]);

  const handlePreset = (p: 'all' | '7d' | '30d') => {
    setPreset(p);
    const now = new Date();
    if (p === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (p === '7d') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (p === '30d') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  const handleYear = (year: number) => {
    setPreset(`year-${year}`);
    setStartDate(`${year}-01-01`);
    setEndDate(`${year}-12-31`);
  };

  const displayYears = useMemo(() => {
    if (availableYears.length > 0) return availableYears;
    return [new Date().getFullYear()];
  }, [availableYears]);

  // Group items by local Date
  const filteredAndGrouped = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = items.filter(it => {
      if (!q) return true;
      return (
        it.title?.toLowerCase().includes(q) ||
        it.episode_title?.toLowerCase().includes(q) ||
        it.show_title?.toLowerCase().includes(q)
      );
    });

    const groups: { [dateStr: string]: WatchItem[] } = {};
    filtered.forEach(it => {
      const d = new Date(it.watched_at);
      const dateKey = d.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(it);
    });

    return groups;
  }, [items, searchQuery]);

  return (
    <div className="min-h-screen bg-[#090c13] text-[#f0f3f8] antialiased">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-50 border-b border-[#1b2234] bg-[#0c101a]/95 backdrop-blur-md px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ed1c24] flex items-center justify-center font-black text-white text-base shadow-md shadow-[#ed1c24]/40">
              T
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm lg:text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span className="text-white">Trakt</span>
                  <span className="text-[#ed1c24]">Lens</span>
                </h1>
                <span className="text-[10px] font-semibold bg-[#1a2130] text-[#8e9cae] border border-[#27324a] px-2 py-0.5 rounded-full">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-[#768496]">Personal Watch History & Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${
              isNeon 
                ? 'bg-[#00e599]/10 text-[#00e599] border-[#00e599]/30' 
                : 'bg-[#3b82f6]/10 text-[#60a5fa] border-[#3b82f6]/30'
            }`}>
              <Database className="w-3.5 h-3.5" />
              <span>{isNeon ? 'NeonDB Connected' : 'Local Storage Mode'}</span>
            </div>

            {user && (
              <div className="flex items-center gap-2 bg-[#121622] border border-[#1f2739] px-3 py-1 rounded-full text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-semibold text-white">@{user.username}</span>
              </div>
            )}

            <button 
              onClick={fetchHistory}
              title="Refresh Data"
              className="p-1.5 rounded-lg bg-[#141a27] hover:bg-[#1e273b] border border-[#232d42] text-[#8e9cae] hover:text-white transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Metric Cards (Trakt Style) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#121622] border border-[#1d2537] rounded-xl p-5 hover:border-[#ed1c24]/50 transition relative overflow-hidden group shadow-lg shadow-black/20">
            <div className="absolute top-0 right-0 p-4 text-[#ed1c24]/10 group-hover:text-[#ed1c24]/20 transition">
              <Clock className="w-12 h-12" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#79889b]">Lama Menonton</p>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-white mt-1">
              {summary ? summary.formattedDuration : '0m'}
            </h3>
            <p className="text-xs text-[#79889b] mt-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#ed1c24]" />
              <span>{summary ? `${summary.totalMinutes.toLocaleString()} menit total` : '0'}</span>
            </p>
          </div>

          <div className="bg-[#121622] border border-[#1d2537] rounded-xl p-5 hover:border-emerald-500/50 transition relative overflow-hidden group shadow-lg shadow-black/20">
            <div className="absolute top-0 right-0 p-4 text-emerald-500/10 group-hover:text-emerald-500/20 transition">
              <Film className="w-12 h-12" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#79889b]">Film Ditonton</p>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-white mt-1">
              {summary ? summary.movieCount : 0}
            </h3>
            <p className="text-xs text-[#79889b] mt-2">Judul Film Selesai</p>
          </div>

          <div className="bg-[#121622] border border-[#1d2537] rounded-xl p-5 hover:border-indigo-500/50 transition relative overflow-hidden group shadow-lg shadow-black/20">
            <div className="absolute top-0 right-0 p-4 text-indigo-500/10 group-hover:text-indigo-500/20 transition">
              <Tv className="w-12 h-12" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#79889b]">Episode Ditonton</p>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-white mt-1">
              {summary ? summary.episodeCount : 0}
            </h3>
            <p className="text-xs text-[#79889b] mt-2">
              dari {summary ? summary.uniqueShowsCount : 0} Serial TV
            </p>
          </div>

          <div className="bg-[#121622] border border-[#1d2537] rounded-xl p-5 hover:border-amber-500/50 transition relative overflow-hidden group shadow-lg shadow-black/20">
            <div className="absolute top-0 right-0 p-4 text-amber-500/10 group-hover:text-amber-500/20 transition">
              <Layers className="w-12 h-12" />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#79889b]">Total Tontonan</p>
            <h3 className="text-2xl lg:text-3xl font-extrabold text-white mt-1">
              {summary ? summary.totalItems : 0}
            </h3>
            <p className="text-xs text-[#79889b] mt-2">Aktivitas Terarsip</p>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="bg-[#121622] border border-[#1d2537] rounded-xl p-4 lg:p-6 space-y-4 shadow-lg shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#ed1c24]" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">Filter & Pencarian</span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#0a0d14] p-1 rounded-lg border border-[#1f283d]">
              <button
                onClick={() => handlePreset('all')}
                className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                  preset === 'all' 
                    ? 'bg-[#ed1c24] text-white shadow-sm shadow-[#ed1c24]/50' 
                    : 'text-[#7e8d9f] hover:text-white'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => handlePreset('7d')}
                className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                  preset === '7d' 
                    ? 'bg-[#ed1c24] text-white shadow-sm shadow-[#ed1c24]/50' 
                    : 'text-[#7e8d9f] hover:text-white'
                }`}
              >
                7 Hari
              </button>
              <button
                onClick={() => handlePreset('30d')}
                className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                  preset === '30d' 
                    ? 'bg-[#ed1c24] text-white shadow-sm shadow-[#ed1c24]/50' 
                    : 'text-[#7e8d9f] hover:text-white'
                }`}
              >
                30 Hari
              </button>

              {/* Dynamic Years based on actual data */}
              {displayYears.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYear(year)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    preset === `year-${year}`
                      ? 'bg-[#ed1c24] text-white shadow-sm shadow-[#ed1c24]/50' 
                      : 'text-[#7e8d9f] hover:text-white'
                  }`}
                >
                  Tahun {year}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-[#1b2234]">
            <div>
              <label className="block text-[11px] font-semibold text-[#7e8d9f] uppercase mb-1">Cari Judul</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#58687d]" />
                <input
                  type="text"
                  placeholder="Ketik nama film atau serial..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090c13] border border-[#1f283d] rounded-lg text-xs text-white placeholder-[#58687d] focus:border-[#ed1c24] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#7e8d9f] uppercase mb-1">Mulai Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPreset('custom');
                }}
                className="w-full px-3 py-2 bg-[#090c13] border border-[#1f283d] rounded-lg text-xs text-white focus:border-[#ed1c24] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#7e8d9f] uppercase mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPreset('custom');
                }}
                className="w-full px-3 py-2 bg-[#090c13] border border-[#1f283d] rounded-lg text-xs text-white focus:border-[#ed1c24] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#7e8d9f] uppercase mb-1">Tipe Media</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#090c13] border border-[#1f283d] rounded-lg text-xs text-white focus:border-[#ed1c24] outline-none"
              >
                <option value="all">Semua (Film & Serial)</option>
                <option value="movie">Hanya Film</option>
                <option value="episode">Hanya Serial / Episode</option>
              </select>
            </div>
          </div>
        </section>

        {/* Media Grid Grouped by Date */}
        <section className="space-y-8">
          {Object.keys(filteredAndGrouped).length === 0 ? (
            <div className="bg-[#121622] border border-[#1d2537] rounded-xl p-12 text-center shadow-lg shadow-black/20">
              <PlayCircle className="w-12 h-12 text-[#3b475e] mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Tidak Ada Data Tontonan</h3>
              <p className="text-xs text-[#79889b] max-w-md mx-auto mt-1">
                Tidak ada riwayat tontonan yang sesuai dengan filter. Coba ubah rentang tanggal atau klik tombol <b>Semua</b>.
              </p>
            </div>
          ) : (
            Object.entries(filteredAndGrouped).map(([dateLabel, groupItems]) => (
              <div key={dateLabel} className="space-y-4">
                {/* Date Heading */}
                <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#ed1c24]" />
                    <h2 className="text-sm font-bold text-white capitalize tracking-wide">{dateLabel}</h2>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#171d2b] border border-[#222c42] text-[#8796a8]">
                    {groupItems.length} Item
                  </span>
                </div>

                {/* Trakt Style Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupItems.map((item) => {
                    const isEpisode = item.type === 'episode';
                    const watchDate = new Date(item.watched_at);
                    const watchTimeStr = watchDate.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    const traktUrl = isEpisode
                      ? `https://app.trakt.tv/shows/${item.show_slug}?view=episode&season=${item.season_number}&episode=${item.episode_number}`
                      : `https://app.trakt.tv/movies/${item.slug}`;

                    const imageUrl = item.thumb_url || item.poster_url || '/placeholder.png';

                    return (
                      <div
                        key={item.id}
                        className="group bg-[#121622] border border-[#1c2436] hover:border-[#ed1c24]/50 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60"
                      >
                        {/* Cover (16:9 like Trakt history cards) */}
                        <div className="relative w-full aspect-[16/9] bg-[#0c101a] overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />

                          {/* Top Tag (Waktu Jam Tonton) */}
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-bold text-white border border-white/10 shadow-sm">
                            <Clock className="w-3 h-3 text-[#ed1c24]" />
                            <span>{watchTimeStr} WIB</span>
                          </div>

                          {/* Runtime Duration Badge */}
                          {item.runtime_minutes > 0 && (
                            <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                              {item.runtime_minutes} min
                            </div>
                          )}

                          {/* Trakt Direct Link Button */}
                          <a
                            href={traktUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute top-2 right-2 p-1.5 rounded-md bg-black/70 text-white/80 hover:text-white hover:bg-[#ed1c24] transition opacity-0 group-hover:opacity-100 shadow"
                            title="Buka di Trakt.tv"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {/* Card Footer Info */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-[13px] font-bold text-white line-clamp-1 group-hover:text-[#ed1c24] transition">
                                {item.title}
                              </h4>
                              <button 
                                className="text-[#5a6a7e] hover:text-[#ed1c24] transition p-0.5"
                                title="Rating"
                              >
                                <Star className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {isEpisode ? (
                              <p className="text-xs text-[#7e8d9f] mt-0.5 line-clamp-1">
                                <span className="font-semibold text-white/90">
                                  M{item.season_number} • E{item.episode_number}
                                </span>
                                {item.episode_title && (
                                  <span className="text-[#a4b3c4]"> - {item.episode_title}</span>
                                )}
                              </p>
                            ) : (
                              <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                                Film
                              </p>
                            )}
                          </div>

                          {item.genres && item.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {item.genres.slice(0, 3).map((g) => (
                                <span
                                  key={g}
                                  className="text-[10px] font-medium bg-[#171e2c] border border-[#20293c] text-[#7e8d9f] px-2 py-0.5 rounded capitalize"
                                >
                                  {g}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-[#171d2b] py-8 text-center text-xs text-[#5e6d80]">
        <p className="font-medium text-[#768496]">
          <span className="text-white font-semibold">Trakt</span>
          <span className="text-[#ed1c24] font-semibold">Lens</span> • Didesain dengan estetika Trakt.tv
        </p>
        <p className="mt-1">Ditenagai oleh Next.js, Vercel & Neon Database</p>
      </footer>
    </div>
  );
}
