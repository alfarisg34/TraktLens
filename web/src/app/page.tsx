'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  SlidersHorizontal, 
  X, 
  RotateCcw, 
  Check,
  Trophy,
  Flame,
  Repeat,
  Zap,
  Award,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp
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

interface FunFactsData {
  longestMovie: {
    title: string;
    slug: string;
    runtimeMinutes: number;
    formattedDuration: string;
    poster_url?: string | null;
    genres?: string[];
  } | null;
  shortestMovie: {
    title: string;
    slug: string;
    runtimeMinutes: number;
    formattedDuration: string;
    poster_url?: string | null;
    genres?: string[];
  } | null;
  topShows: Array<{
    title: string;
    slug?: string;
    episodes: number;
    runtimeMinutes: number;
    formattedDuration: string;
    poster_url?: string | null;
  }>;
  rewatchedMovies: Array<{
    title: string;
    slug: string;
    count: number;
    poster_url?: string | null;
  }>;
  busiestDay: {
    day: string;
    count: number;
  };
  peakHour: {
    hour: number;
    formatted: string;
    count: number;
    persona: string;
  };
  recordBingeDay: {
    date: string;
    formattedDate: string;
    count: number;
    formattedDuration: string;
  } | null;
}

export default function Dashboard() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [funFacts, setFunFacts] = useState<FunFactsData | null>(null);
  const [showFunFacts, setShowFunFacts] = useState(true);
  const [user, setUser] = useState<{ username: string; avatar_url?: string } | null>(null);
  const [isNeon, setIsNeon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);

  // Drawer & Filter States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [preset, setPreset] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'episode'>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [durationFilter, setDurationFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest' | 'runtime_desc' | 'runtime_asc'>('latest');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (selectedGenre !== 'all') params.append('genre', selectedGenre);
      if (sortOrder !== 'latest') params.append('sort', sortOrder);

      if (durationFilter === 'short') {
        params.append('maxRuntime', '30');
      } else if (durationFilter === 'medium') {
        params.append('minRuntime', '31');
        params.append('maxRuntime', '90');
      } else if (durationFilter === 'long') {
        params.append('minRuntime', '91');
      }

      const res = await fetch(`/api/history?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setSummary(data.summary);
        if (data.funFacts) {
          setFunFacts(data.funFacts);
        }
        setUser(data.user);
        setIsNeon(data.isNeon);
        if (data.availableYears && data.availableYears.length > 0) {
          setAvailableYears(data.availableYears);
        }
        if (data.availableGenres && data.availableGenres.length > 0) {
          setAvailableGenres(data.availableGenres);
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
  }, [startDate, endDate, typeFilter, selectedGenre, durationFilter, sortOrder]);

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

  const handleResetFilters = () => {
    setTypeFilter('all');
    setSelectedGenre('all');
    setDurationFilter('all');
    setSortOrder('latest');
    setStartDate('');
    setEndDate('');
    setPreset('all');
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== 'all') count++;
    if (selectedGenre !== 'all') count++;
    if (durationFilter !== 'all') count++;
    if (sortOrder !== 'latest') count++;
    if (startDate || endDate) count++;
    return count;
  }, [typeFilter, selectedGenre, durationFilter, sortOrder, startDate, endDate]);

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
    <div className="min-h-screen bg-[#090c13] text-[#f0f3f8] antialiased relative">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#1b2234] bg-[#0c101a]/95 backdrop-blur-md px-4 lg:px-8 py-3">
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
                <Link
                  href="/changelog"
                  className="text-[10px] font-semibold bg-[#1a2130] text-[#8e9cae] hover:text-[#ed1c24] hover:border-[#ed1c24]/50 border border-[#27324a] px-2 py-0.5 rounded-full transition flex items-center gap-1"
                  title="Lihat Catatan Rilis & Log Versi"
                >
                  v0.1.0
                </Link>
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

        {/* Fun Facts & Records Bento Grid */}
        {funFacts && (
          <section className="bg-[#10141f] border border-[#1c2436] rounded-2xl p-5 lg:p-6 space-y-5 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#ed1c24]/10 border border-[#ed1c24]/30 text-[#ed1c24]">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <span>Fakta Unik & Rekor Tontonan</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#1c2538] text-[#8e9cae] border border-[#2b374e] uppercase tracking-wider">
                      Personal Records
                    </span>
                  </h2>
                  <p className="text-xs text-[#79889b] mt-0.5">
                    Statistik superlatif film terpanjang, serial terfavorit, rewatch, dan kebiasaan menonton Anda
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowFunFacts(!showFunFacts)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a27] hover:bg-[#1e273b] border border-[#232d42] text-xs font-semibold text-[#8e9cae] hover:text-white transition cursor-pointer"
              >
                <span>{showFunFacts ? 'Sembunyikan' : 'Tampilkan'}</span>
                {showFunFacts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {showFunFacts && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {/* 1. Rekor Film: Terpanjang vs Terpendek */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col justify-between hover:border-[#ed1c24]/40 transition space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-[#ed1c24]" />
                      <span>Film Terpanjang & Terpendek</span>
                    </span>
                    <span className="text-[10px] text-[#52637a] font-medium">Durasi Menit</span>
                  </div>

                  {funFacts.longestMovie ? (
                    <div className="space-y-3">
                      {/* Terpanjang */}
                      <div className="flex items-center gap-3 bg-[#0a0d14] p-2.5 rounded-lg border border-[#1a2233]">
                        {funFacts.longestMovie.poster_url ? (
                          <img 
                            src={funFacts.longestMovie.poster_url} 
                            alt={funFacts.longestMovie.title}
                            className="w-10 h-14 object-cover rounded shadow shrink-0" 
                          />
                        ) : (
                          <div className="w-10 h-14 bg-[#1b2234] rounded flex items-center justify-center shrink-0">
                            <Film className="w-5 h-5 text-[#4e5f78]" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-[#ed1c24] uppercase tracking-wider block">
                            Terpanjang ({funFacts.longestMovie.formattedDuration})
                          </span>
                          <h4 className="text-xs font-bold text-white truncate" title={funFacts.longestMovie.title}>
                            {funFacts.longestMovie.title}
                          </h4>
                          <span className="text-[10px] text-[#79889b]">
                            {funFacts.longestMovie.runtimeMinutes} menit • {funFacts.longestMovie.genres?.slice(0, 2).join(', ') || 'Film'}
                          </span>
                        </div>
                      </div>

                      {/* Terpendek */}
                      {funFacts.shortestMovie && (
                        <div className="flex items-center gap-3 bg-[#0a0d14] p-2.5 rounded-lg border border-[#1a2233]">
                          {funFacts.shortestMovie.poster_url ? (
                            <img 
                              src={funFacts.shortestMovie.poster_url} 
                              alt={funFacts.shortestMovie.title}
                              className="w-10 h-14 object-cover rounded shadow shrink-0" 
                            />
                          ) : (
                            <div className="w-10 h-14 bg-[#1b2234] rounded flex items-center justify-center shrink-0">
                              <Film className="w-5 h-5 text-[#4e5f78]" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                              Terpendek ({funFacts.shortestMovie.formattedDuration})
                            </span>
                            <h4 className="text-xs font-bold text-white truncate" title={funFacts.shortestMovie.title}>
                              {funFacts.shortestMovie.title}
                            </h4>
                            <span className="text-[10px] text-[#79889b]">
                              {funFacts.shortestMovie.runtimeMinutes} menit • {funFacts.shortestMovie.genres?.slice(0, 2).join(', ') || 'Film Pendek'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[#52637a] py-4 text-center">Belum ada data film di rentang ini</p>
                  )}
                </div>

                {/* 2. Series Paling Banyak Ditonton (Binge Champion) */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/40 transition space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Serial Terfavorit (Top Series)</span>
                    </span>
                    <span className="text-[10px] text-[#52637a] font-medium">Binge Rank</span>
                  </div>

                  {funFacts.topShows && funFacts.topShows.length > 0 ? (
                    <div className="space-y-2">
                      {/* Rank 1 Feature */}
                      <div className="flex items-center gap-3 bg-[#0a0d14] p-2.5 rounded-lg border border-indigo-500/20">
                        {funFacts.topShows[0].poster_url ? (
                          <img 
                            src={funFacts.topShows[0].poster_url} 
                            alt={funFacts.topShows[0].title}
                            className="w-10 h-14 object-cover rounded shadow shrink-0" 
                          />
                        ) : (
                          <div className="w-10 h-14 bg-[#1b2234] rounded flex items-center justify-center shrink-0">
                            <Tv className="w-5 h-5 text-indigo-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              #1 JUARA
                            </span>
                            <span className="text-[10px] font-bold text-indigo-400">
                              {funFacts.topShows[0].episodes} Episode
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white truncate mt-0.5" title={funFacts.topShows[0].title}>
                            {funFacts.topShows[0].title}
                          </h4>
                          <span className="text-[10px] text-[#79889b]">
                            Total {funFacts.topShows[0].formattedDuration} menonton
                          </span>
                        </div>
                      </div>

                      {/* Rank 2 & 3 */}
                      <div className="space-y-1.5 pt-1">
                        {funFacts.topShows.slice(1, 3).map((show, idx) => (
                          <div key={show.title} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-[#0e121b] border border-[#182030]">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <span className="text-[10px] font-bold text-[#5c6e88] w-4">#{idx + 2}</span>
                              <span className="text-white font-medium truncate text-xs" title={show.title}>
                                {show.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-indigo-300 shrink-0">
                              {show.episodes} ep ({show.formattedDuration})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#52637a] py-4 text-center">Belum ada serial di rentang ini</p>
                  )}
                </div>

                {/* 3. Film yang Ditonton Lebih Dari Sekali (Rewatch) */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ditonton Lebih dari Sekali</span>
                    </span>
                    <span className="text-[10px] text-[#52637a] font-medium">Rewatch</span>
                  </div>

                  {funFacts.rewatchedMovies && funFacts.rewatchedMovies.length > 0 ? (
                    <div className="space-y-2">
                      {funFacts.rewatchedMovies.map((movie) => (
                        <div key={movie.title} className="flex items-center justify-between bg-[#0a0d14] p-2.5 rounded-lg border border-[#1a2233]">
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            {movie.poster_url ? (
                              <img src={movie.poster_url} alt={movie.title} className="w-7 h-10 object-cover rounded shrink-0" />
                            ) : (
                              <div className="w-7 h-10 bg-[#1b2234] rounded flex items-center justify-center shrink-0">
                                <Film className="w-3.5 h-3.5 text-[#52637a]" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate" title={movie.title}>
                                {movie.title}
                              </h4>
                              <span className="text-[10px] text-[#79889b]">Film diputar berulang</span>
                            </div>
                          </div>
                          <span className="px-2 py-1 rounded-md text-[11px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                            {movie.count}x Ditonton
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#0a0d14] p-4 rounded-lg border border-[#1a2233] text-center my-auto">
                      <Repeat className="w-6 h-6 text-[#354359] mx-auto mb-1.5" />
                      <p className="text-xs text-[#8e9cae] font-medium">Belum Ada Rewatch</p>
                      <p className="text-[10px] text-[#52637a] mt-0.5">Semua judul film di rentang ini baru ditonton 1 kali.</p>
                    </div>
                  )}
                </div>

                {/* 4. Rekor Maraton Tergila (Single-Day Binge) */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Rekor Maraton Tergila (1 Hari)</span>
                    </span>
                    <span className="text-[10px] text-[#52637a] font-medium">Peak Binge</span>
                  </div>

                  {funFacts.recordBingeDay ? (
                    <div className="bg-[#0a0d14] p-4 rounded-lg border border-amber-500/20 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 text-amber-500/10 group-hover:text-amber-500/20 transition">
                        <Flame className="w-16 h-16" />
                      </div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                        Tontonan Terbanyak dalam 24 Jam
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-black text-white">{funFacts.recordBingeDay.count}</span>
                        <span className="text-xs font-semibold text-[#8e9cae]">aktivitas tontonan</span>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-[#1a2233] flex items-center justify-between text-xs">
                        <span className="text-[#a0afc2] font-semibold">{funFacts.recordBingeDay.formattedDate}</span>
                        <span className="text-amber-400 font-bold">{funFacts.recordBingeDay.formattedDuration} total</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#52637a] py-4 text-center">Belum ada rekor maraton</p>
                  )}
                </div>

                {/* 5. Kebiasaan Waktu & Persona Nonton */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col justify-between hover:border-purple-500/40 transition space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-purple-400" />
                      <span>Kebiasaan & Persona Nonton</span>
                    </span>
                    <span className="text-[10px] text-[#52637a] font-medium">WIB Routine</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="bg-[#0a0d14] p-3 rounded-lg border border-[#1a2233] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-[#667790] uppercase tracking-wider block">
                          Hari Paling Produktif
                        </span>
                        <h4 className="text-sm font-extrabold text-white mt-0.5">
                          Hari {funFacts.busiestDay.day}
                        </h4>
                      </div>
                      <span className="px-2 py-1 rounded bg-[#161d2d] text-xs font-bold text-purple-300 border border-[#232e47]">
                        {funFacts.busiestDay.count} tontonan
                      </span>
                    </div>

                    <div className="bg-[#0a0d14] p-3 rounded-lg border border-[#1a2233] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-[#667790] uppercase tracking-wider block">
                          Jam Puncak Menonton
                        </span>
                        <h4 className="text-sm font-extrabold text-white mt-0.5">
                          {funFacts.peakHour.formatted}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        {funFacts.peakHour.persona}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. Top Genre Leaderboard */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col justify-between hover:border-sky-500/40 transition space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-sky-400" />
                      <span>Genre Paling Mendominasi</span>
                    </span>
                    <span className="text-[10px] text-[#52637a] font-medium">Top Categories</span>
                  </div>

                  {summary && summary.genresBreakdown.length > 0 ? (
                    <div className="space-y-2">
                      {summary.genresBreakdown.slice(0, 4).map(([genreName, count], idx) => {
                        const topCount = summary.genresBreakdown[0][1] || 1;
                        const pct = Math.round((count / topCount) * 100);
                        return (
                          <div key={genreName} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-white flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-[#5c6e88]">#{idx + 1}</span>
                                <span>{genreName}</span>
                              </span>
                              <span className="text-[10px] font-bold text-sky-400">{count} item</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#0a0d14] rounded-full overflow-hidden border border-[#1b2234]">
                              <div 
                                className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#52637a] py-4 text-center">Belum ada kategori tontonan</p>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Filter Bar & Controls */}
        <section className="bg-[#121622] border border-[#1d2537] rounded-xl p-4 lg:p-5 space-y-4 shadow-lg shadow-black/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#a0afc2] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#ed1c24]" />
                <span>Rentang Waktu</span>
              </span>
            </div>

            {/* Presets Bar */}
            <div className="flex items-center gap-1.5 bg-[#0a0d14] p-1.5 rounded-xl border border-[#1e273b] max-w-full overflow-x-auto">
              {/* Group 1: Quick Ranges */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handlePreset('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    preset === 'all' 
                      ? 'bg-[#ed1c24] text-white shadow-md shadow-[#ed1c24]/30' 
                      : 'text-[#8291a4] hover:text-white hover:bg-[#151c2a]'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => handlePreset('7d')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    preset === '7d' 
                      ? 'bg-[#ed1c24] text-white shadow-md shadow-[#ed1c24]/30' 
                      : 'text-[#8291a4] hover:text-white hover:bg-[#151c2a]'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  onClick={() => handlePreset('30d')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    preset === '30d' 
                      ? 'bg-[#ed1c24] text-white shadow-md shadow-[#ed1c24]/30' 
                      : 'text-[#8291a4] hover:text-white hover:bg-[#151c2a]'
                  }`}
                >
                  30 Hari
                </button>
              </div>

              {/* Subtle Divider */}
              <div className="h-4 w-px bg-[#20293d] mx-1 shrink-0" />

              {/* Group 2: Dynamic Years */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#52637a] pl-1 pr-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#52637a]" />
                  <span className="hidden sm:inline">Tahun:</span>
                </span>
                {displayYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => handleYear(year)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      preset === `year-${year}`
                        ? 'bg-[#ed1c24] text-white shadow-md shadow-[#ed1c24]/30 font-bold' 
                        : 'text-[#8291a4] hover:text-white hover:bg-[#151c2a]'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Bar + Drawer Trigger */}
          <div className="pt-3 border-t border-[#1b2234] flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#58687d]" />
              <input
                type="text"
                placeholder="Cari judul film, serial, atau episode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 bg-[#090c13] border border-[#1f283d] rounded-xl text-xs text-white placeholder-[#58687d] focus:border-[#ed1c24] outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[#58687d] hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Trakt Filter Drawer Trigger Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                activeFilterCount > 0
                  ? 'bg-[#ed1c24] text-white border-[#ed1c24] shadow-md shadow-[#ed1c24]/30'
                  : 'bg-[#151c2a] text-[#8e9cae] hover:text-white border-[#222c42] hover:bg-[#1e273a]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-[#ed1c24] text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
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
                                className="text-[#5a6a7e] hover:text-[#ed1c24] transition p-0.5 cursor-pointer"
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

      {/* Trakt-Style Slide-over Filter Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Blur Overlay */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Panel */}
          <div className="relative w-full sm:w-[420px] bg-[#0c101a] border-l border-[#1d2537] h-full flex flex-col z-10 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1b2234]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#ed1c24]" />
                <h2 className="text-base font-bold text-white tracking-wide">Filter TraktLens</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetFilters}
                  title="Setel ulang semua filter"
                  className="p-1.5 rounded-lg text-[#768496] hover:text-[#ed1c24] hover:bg-[#161c2b] transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  title="Tutup Filter"
                  className="p-1.5 rounded-lg text-[#768496] hover:text-white hover:bg-[#161c2b] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* 1. Tipe Media (Segmented) */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#79889b] block">
                  Tipe Media
                </label>
                <div className="grid grid-cols-3 gap-2 bg-[#080b11] p-1 rounded-xl border border-[#1b2234]">
                  <button
                    onClick={() => setTypeFilter('all')}
                    className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                      typeFilter === 'all' 
                        ? 'bg-[#ed1c24] text-white shadow-sm shadow-[#ed1c24]/40' 
                        : 'text-[#7e8d9f] hover:text-white'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setTypeFilter('movie')}
                    className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                      typeFilter === 'movie' 
                        ? 'bg-[#ed1c24] text-white shadow-sm shadow-[#ed1c24]/40' 
                        : 'text-[#7e8d9f] hover:text-white'
                    }`}
                  >
                    Film
                  </button>
                  <button
                    onClick={() => setTypeFilter('episode')}
                    className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                      typeFilter === 'episode' 
                        ? 'bg-[#ed1c24] text-white shadow-sm shadow-[#ed1c24]/40' 
                        : 'text-[#7e8d9f] hover:text-white'
                    }`}
                  >
                    Serial
                  </button>
                </div>
              </div>

              {/* 2. Genre Filter */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#79889b]">
                    Genre Media
                  </label>
                  {selectedGenre !== 'all' && (
                    <button 
                      onClick={() => setSelectedGenre('all')}
                      className="text-[10px] text-[#ed1c24] hover:underline cursor-pointer"
                    >
                      Reset Genre
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-[#080b11] rounded-xl border border-[#1b2234]">
                  <button
                    onClick={() => setSelectedGenre('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedGenre === 'all'
                        ? 'bg-[#ed1c24] text-white shadow-sm shadow-[#ed1c24]/30'
                        : 'bg-[#121724] text-[#8e9cae] hover:text-white hover:bg-[#1a2233]'
                    }`}
                  >
                    Semua Genre
                  </button>
                  {availableGenres.map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGenre(g)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer capitalize ${
                        selectedGenre === g
                          ? 'bg-[#ed1c24] text-white shadow-sm shadow-[#ed1c24]/30 font-bold'
                          : 'bg-[#121724] text-[#8e9cae] hover:text-white hover:bg-[#1a2233]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Durasi Tontonan */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#79889b] block">
                  Durasi Menit
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDurationFilter('all')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer text-left ${
                      durationFilter === 'all'
                        ? 'bg-[#ed1c24] border-[#ed1c24] text-white font-bold'
                        : 'bg-[#080b11] border-[#1b2234] text-[#8e9cae] hover:text-white'
                    }`}
                  >
                    Semua Durasi
                  </button>
                  <button
                    onClick={() => setDurationFilter('short')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer text-left ${
                      durationFilter === 'short'
                        ? 'bg-[#ed1c24] border-[#ed1c24] text-white font-bold'
                        : 'bg-[#080b11] border-[#1b2234] text-[#8e9cae] hover:text-white'
                    }`}
                  >
                    &lt; 30 Menit (Sitcom)
                  </button>
                  <button
                    onClick={() => setDurationFilter('medium')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer text-left ${
                      durationFilter === 'medium'
                        ? 'bg-[#ed1c24] border-[#ed1c24] text-white font-bold'
                        : 'bg-[#080b11] border-[#1b2234] text-[#8e9cae] hover:text-white'
                    }`}
                  >
                    30 - 90 Menit (Drama)
                  </button>
                  <button
                    onClick={() => setDurationFilter('long')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer text-left ${
                      durationFilter === 'long'
                        ? 'bg-[#ed1c24] border-[#ed1c24] text-white font-bold'
                        : 'bg-[#080b11] border-[#1b2234] text-[#8e9cae] hover:text-white'
                    }`}
                  >
                    &gt; 90 Menit (Film)
                  </button>
                </div>
              </div>

              {/* 4. Urutan Tontonan */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#79889b] block">
                  Urutan Data
                </label>
                <div className="space-y-1.5 bg-[#080b11] p-1.5 rounded-xl border border-[#1b2234]">
                  {[
                    { id: 'latest', label: 'Terbaru Ditonton (Default)' },
                    { id: 'oldest', label: 'Terlama Ditonton' },
                    { id: 'runtime_desc', label: 'Durasi Terpanjang (Desc)' },
                    { id: 'runtime_asc', label: 'Durasi Terpendek (Asc)' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSortOrder(s.id as any)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                        sortOrder === s.id
                          ? 'bg-[#ed1c24] text-white font-bold'
                          : 'text-[#8e9cae] hover:text-white hover:bg-[#121724]'
                      }`}
                    >
                      <span>{s.label}</span>
                      {sortOrder === s.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Custom Date Range */}
              <div className="space-y-2.5 pt-2 border-t border-[#1b2234]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#79889b] block">
                  Rentang Tanggal Khusus
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#768496] mb-1">Dari Tanggal</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPreset('custom');
                      }}
                      className="w-full px-3 py-2 bg-[#080b11] border border-[#1b2234] rounded-lg text-xs text-white focus:border-[#ed1c24] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#768496] mb-1">Sampai Tanggal</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPreset('custom');
                      }}
                      className="w-full px-3 py-2 bg-[#080b11] border border-[#1b2234] rounded-lg text-xs text-white focus:border-[#ed1c24] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#1b2234] bg-[#090c13] flex items-center gap-3">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-2.5 rounded-xl border border-[#232d42] text-xs font-bold text-[#8e9cae] hover:text-white hover:bg-[#151c2a] transition cursor-pointer"
              >
                Reset Filter
              </button>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#ed1c24] hover:bg-[#ff2a33] text-xs font-bold text-white shadow-lg shadow-[#ed1c24]/30 transition cursor-pointer"
              >
                Tutup & Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 border-t border-[#171d2b] py-8 text-center text-xs text-[#5e6d80] space-y-1">
        <p className="font-medium text-[#768496]">
          <span className="text-white font-semibold">Trakt</span>
          <span className="text-[#ed1c24] font-semibold">Lens</span> • Didesain dengan estetika Trakt.tv
        </p>
        <p>Ditenagai oleh Next.js, Vercel & Neon Database</p>
        <p className="pt-2">
          <Link href="/changelog" className="text-[#7e8d9f] hover:text-[#ed1c24] transition underline underline-offset-4">
            Lihat Catatan Rilis & Aturan Versi (Changelog) →
          </Link>
        </p>
      </footer>
    </div>
  );
}
