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
  ChevronUp,
  BarChart3,
  PieChart,
  Milestone,
  Activity,
  Percent,
  ArrowRight,
  Trash2,
  LayoutGrid
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

interface RecapItem {
  key: string;
  type: 'show' | 'movie';
  title: string;
  slug: string;
  show_slug?: string;
  poster_url?: string | null;
  thumb_url?: string | null;
  genres: string[];
  totalMinutes: number;
  formattedHours: string;
  latestWatchedAt: string;
  watchCount: number;
  movieItem?: WatchItem;
  episodesCount: number;
  seasons: number[];
  episodes: WatchItem[];
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
  secondLongestMovie?: {
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
  topLongestMovies?: Array<{
    title: string;
    slug: string;
    runtimeMinutes: number;
    formattedDuration: string;
    poster_url?: string | null;
    genres?: string[];
  }>;
  topShortestMovies?: Array<{
    title: string;
    slug: string;
    runtimeMinutes: number;
    formattedDuration: string;
    poster_url?: string | null;
    genres?: string[];
  }>;
  avgMovieRuntime?: number;
  topShows: Array<{
    title: string;
    slug?: string;
    episodes: number;
    runtimeMinutes: number;
    formattedDuration: string;
    poster_url?: string | null;
  }>;
  topShowsByEpisodes?: Array<{
    title: string;
    slug?: string;
    episodes: number;
    runtimeMinutes: number;
    formattedDuration: string;
    poster_url?: string | null;
  }>;
  topShowsByDuration?: Array<{
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
    runtimeMinutes?: number;
    totalDuration?: string;
    poster_url?: string | null;
  }>;
  totalRewatchCount?: number;
  watchRatio?: {
    movieCount: number;
    episodeCount: number;
    movieMinutes: number;
    episodeMinutes: number;
    movieFormattedHours: string;
    episodeFormattedHours: string;
    moviePercentCount: number;
    episodePercentCount: number;
    moviePercentDuration: number;
    episodePercentDuration: number;
  };
  dayOfWeekStats?: Array<{
    dayIdx: number;
    shortName: string;
    fullName: string;
    count: number;
    percent: number;
    relativeHeight: number;
  }>;
  timeOfDayStats?: {
    morning: { label: string; timeRange: string; count: number; percent: number };
    afternoon: { label: string; timeRange: string; count: number; percent: number };
    evening: { label: string; timeRange: string; count: number; percent: number };
    night: { label: string; timeRange: string; count: number; percent: number };
  };
  busiestDay: {
    day: string;
    count: number;
    percent?: number;
  };
  peakHour: {
    hour: number;
    formatted: string;
    count: number;
    persona: string;
  };
  recordBingeDay: {
    realBinge: {
      date: string;
      formattedDate: string;
      count: number;
      formattedDuration: string;
    } | null;
    allTimeMaxDay: {
      date: string;
      formattedDate: string;
      count: number;
      formattedDuration: string;
    } | null;
  } | null;
  timelineMilestone?: {
    firstWatched: {
      title: string;
      show_title?: string | null;
      season_number?: number | null;
      episode_number?: number | null;
      episode_title?: string | null;
      type: string;
      watched_at: string;
      poster_url?: string | null;
      formattedDate: string;
    } | null;
    latestWatched: {
      title: string;
      show_title?: string | null;
      season_number?: number | null;
      episode_number?: number | null;
      episode_title?: string | null;
      type: string;
      watched_at: string;
      poster_url?: string | null;
      formattedDate: string;
    } | null;
    yearsSpan: number;
  };
}

export default function Dashboard() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [funFacts, setFunFacts] = useState<FunFactsData | null>(null);
  const [showFunFacts, setShowFunFacts] = useState(true);
  const [seriesRankBy, setSeriesRankBy] = useState<'episodes' | 'duration'>('episodes');
  const [user, setUser] = useState<{ username: string; avatar_url?: string } | null>(null);
  const [isNeon, setIsNeon] = useState(false);
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [yearlyBreakdown, setYearlyBreakdown] = useState<Array<{ year: number; count: number; movies: number; episodes: number; minutes: number; formattedDuration: string; formattedHours: string }>>([]);

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
  const [groupByDate, setGroupByDate] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'daily' | 'flat' | 'recap'>('daily');
  const [recapTypeFilter, setRecapTypeFilter] = useState<'all' | 'show' | 'movie'>('all');
  const [recapSort, setRecapSort] = useState<'latest' | 'count_desc' | 'duration_desc' | 'title_asc'>('latest');
  const [expandedShowKey, setExpandedShowKey] = useState<string | null>(null);

  // Restore view mode preference from localStorage
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('traktlens_view_mode');
      if (savedMode === 'daily' || savedMode === 'flat' || savedMode === 'recap') {
        setViewMode(savedMode);
        setGroupByDate(savedMode === 'daily');
      } else {
        const saved = localStorage.getItem('traktlens_group_by_date');
        if (saved !== null) {
          const isDaily = saved === 'true';
          setGroupByDate(isDaily);
          setViewMode(isDaily ? 'daily' : 'flat');
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSetViewMode = (mode: 'daily' | 'flat' | 'recap') => {
    setViewMode(mode);
    setGroupByDate(mode === 'daily');
    try {
      localStorage.setItem('traktlens_view_mode', mode);
      localStorage.setItem('traktlens_group_by_date', String(mode === 'daily'));
    } catch {
      // ignore
    }
  };

  const handleToggleGrouping = (val: boolean) => {
    handleSetViewMode(val ? 'daily' : 'flat');
  };

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
        if (data.yearlyBreakdown && data.yearlyBreakdown.length > 0) {
          setYearlyBreakdown(data.yearlyBreakdown);
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

  const handleDeleteItem = async (id: string | number, title: string) => {
    if (!window.confirm(`Hapus "${title}" dari database riwayat tontonan?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems(prev => prev.filter(it => String(it.id) !== String(id)));
        if (summary) {
          setSummary(prev => prev ? { ...prev, totalItems: Math.max(0, prev.totalItems - 1) } : null);
        }
      } else {
        const err = await res.json();
        alert(`Gagal menghapus: ${err.error || 'Terjadi kesalahan'}`);
      }
    } catch (e: any) {
      alert(`Gagal menghapus: ${e.message}`);
    }
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

  const selectedYear = useMemo(() => {
    return preset.startsWith('year-') ? parseInt(preset.replace('year-', ''), 10) : null;
  }, [preset]);

  // Filter items by search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter(it => {
      if (!q) return true;
      return (
        it.title?.toLowerCase().includes(q) ||
        it.episode_title?.toLowerCase().includes(q) ||
        it.show_title?.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery]);

  // Group items by local Date
  const groupedByDate = useMemo(() => {
    const groups: { [dateStr: string]: WatchItem[] } = {};
    filteredItems.forEach(it => {
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
  }, [filteredItems]);

  // Label periode aktif untuk judul Highlight & Rekap
  const activePeriodLabel = useMemo(() => {
    if (preset === '7d') return '7 Hari Terakhir';
    if (preset === '30d') return '30 Hari Terakhir';
    if (preset.startsWith('year-')) return `Tahun ${preset.replace('year-', '')}`;
    if (startDate || endDate) {
      if (startDate && endDate) return `${startDate} s/d ${endDate}`;
      if (startDate) return `Sejak ${startDate}`;
      return `Hingga ${endDate}`;
    }
    return 'Sepanjang Waktu (Semua)';
  }, [preset, startDate, endDate]);

  // Agregasi item untuk Highlight & Rekap: Series menjadi 1 card per judul, Film normal
  const recapData = useMemo(() => {
    const map: { [key: string]: RecapItem } = {};
    let totalEpisodes = 0;
    let totalMovieCount = 0;
    let totalSeriesCount = 0;

    filteredItems.forEach(it => {
      if (it.type === 'episode') {
        totalEpisodes++;
        const showKey = (it.show_slug || it.show_title || it.title || 'unknown-show').toLowerCase();
        if (!map[showKey]) {
          totalSeriesCount++;
          map[showKey] = {
            key: showKey,
            type: 'show',
            title: it.show_title || it.title,
            slug: it.show_slug || it.slug,
            show_slug: it.show_slug || it.slug,
            poster_url: it.poster_url || it.thumb_url,
            thumb_url: it.thumb_url || it.poster_url,
            genres: it.genres ? [...it.genres] : [],
            totalMinutes: 0,
            formattedHours: '',
            latestWatchedAt: it.watched_at,
            watchCount: 0,
            episodesCount: 0,
            seasons: [],
            episodes: [],
          };
        }

        const entry = map[showKey];
        entry.episodesCount += 1;
        entry.totalMinutes += (it.runtime_minutes || 0);
        entry.episodes.push(it);

        if (it.season_number && !entry.seasons.includes(it.season_number)) {
          entry.seasons.push(it.season_number);
        }

        if (new Date(it.watched_at).getTime() > new Date(entry.latestWatchedAt).getTime()) {
          entry.latestWatchedAt = it.watched_at;
          if (it.poster_url) entry.poster_url = it.poster_url;
          if (it.thumb_url) entry.thumb_url = it.thumb_url;
        }

        if (it.genres) {
          it.genres.forEach(g => {
            if (!entry.genres.includes(g)) entry.genres.push(g);
          });
        }
      } else {
        totalMovieCount++;
        const movieKey = (it.slug || it.title || String(it.id)).toLowerCase();
        if (!map[movieKey]) {
          map[movieKey] = {
            key: movieKey,
            type: 'movie',
            title: it.title,
            slug: it.slug,
            poster_url: it.poster_url || it.thumb_url,
            thumb_url: it.thumb_url || it.poster_url,
            genres: it.genres ? [...it.genres] : [],
            totalMinutes: 0,
            formattedHours: '',
            latestWatchedAt: it.watched_at,
            watchCount: 0,
            episodesCount: 0,
            seasons: [],
            episodes: [],
            movieItem: it,
          };
        }

        const entry = map[movieKey];
        entry.watchCount += 1;
        entry.totalMinutes += (it.runtime_minutes || 0);
        if (new Date(it.watched_at).getTime() > new Date(entry.latestWatchedAt).getTime()) {
          entry.latestWatchedAt = it.watched_at;
          entry.movieItem = it;
        }
        if (it.genres) {
          it.genres.forEach(g => {
            if (!entry.genres.includes(g)) entry.genres.push(g);
          });
        }
      }
    });

    const list = Object.values(map).map(item => {
      if (item.episodes.length > 0) {
        item.episodes.sort((a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime());
      }
      const hrs = Math.floor(item.totalMinutes / 60);
      const mins = item.totalMinutes % 60;
      item.formattedHours = hrs > 0 ? `${hrs}j ${mins}m` : `${mins}m`;
      return item;
    });

    return {
      items: list,
      totalShows: totalSeriesCount,
      totalMovies: Object.values(map).filter(x => x.type === 'movie').length,
      totalEpisodes,
    };
  }, [filteredItems]);

  // Filter & sort list pada tampilan Highlight & Rekap
  const filteredAndSortedRecap = useMemo(() => {
    let list = [...recapData.items];

    if (recapTypeFilter === 'show') {
      list = list.filter(it => it.type === 'show');
    } else if (recapTypeFilter === 'movie') {
      list = list.filter(it => it.type === 'movie');
    }

    if (recapSort === 'latest') {
      list.sort((a, b) => new Date(b.latestWatchedAt).getTime() - new Date(a.latestWatchedAt).getTime());
    } else if (recapSort === 'count_desc') {
      list.sort((a, b) => {
        const countA = a.type === 'show' ? a.episodesCount : a.watchCount;
        const countB = b.type === 'show' ? b.episodesCount : b.watchCount;
        return countB - countA;
      });
    } else if (recapSort === 'duration_desc') {
      list.sort((a, b) => b.totalMinutes - a.totalMinutes);
    } else if (recapSort === 'title_asc') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [recapData, recapTypeFilter, recapSort]);

  // Helper renderer untuk kartu riwayat media (Trakt Card)
  const renderWatchCard = (item: WatchItem, showDate: boolean = false) => {
    const isEpisode = item.type === 'episode';
    const watchDate = new Date(item.watched_at);
    const watchTimeStr = watchDate.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateShortStr = watchDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
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

          {/* Top Tag (Waktu Jam / Tanggal Tonton) */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-bold text-white border border-white/10 shadow-sm">
            <Clock className="w-3 h-3 text-[#ed1c24]" />
            <span>{showDate ? `${dateShortStr} • ${watchTimeStr} WIB` : `${watchTimeStr} WIB`}</span>
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
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item.id, item.title);
                  }}
                  className="text-[#4e5c70] hover:text-[#ef4444] transition p-0.5 cursor-pointer opacity-0 group-hover:opacity-100"
                  title="Hapus riwayat tontonan ini dari database"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  className="text-[#5a6a7e] hover:text-[#ed1c24] transition p-0.5 cursor-pointer"
                  title="Rating"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              </div>
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
  };

  // Helper renderer untuk kartu Highlight & Rekap (1 Card / Series + Film)
  const renderRecapCard = (item: RecapItem) => {
    const isShow = item.type === 'show';
    const lastDate = new Date(item.latestWatchedAt);
    const lastDateStr = lastDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: lastDate.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    });

    const traktUrl = isShow
      ? `https://app.trakt.tv/shows/${item.show_slug || item.slug}`
      : `https://app.trakt.tv/movies/${item.slug}`;

    const imageUrl = item.thumb_url || item.poster_url || '/placeholder.png';
    const isExpanded = expandedShowKey === item.key;

    return (
      <div
        key={item.key}
        className="group bg-[#121622] border border-[#1c2436] hover:border-[#ed1c24]/50 rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60"
      >
        {/* Cover 16:9 */}
        <div className="relative w-full aspect-[16/9] bg-[#0c101a] overflow-hidden">
          <img
            src={imageUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Top-Left Tag: Type Badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-bold border border-white/10 shadow-sm">
            {isShow ? (
              <>
                <Tv className="w-3 h-3 text-purple-400" />
                <span className="text-purple-300">Series</span>
              </>
            ) : (
              <>
                <Film className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300">Film</span>
              </>
            )}
          </div>

          {/* Bottom-Left Tag: Last Watched Date */}
          <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-medium text-[#c4d1e0] border border-white/10">
            Terakhir: {lastDateStr}
          </div>

          {/* Bottom-Right Tag: Total Episodes & Runtime */}
          <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
            {isShow 
              ? `${item.episodesCount} Eps • ${item.formattedHours}`
              : item.formattedHours || `${item.totalMinutes} min`
            }
          </div>

          {/* Trakt Link Button */}
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

        {/* Card Body */}
        <div className="p-3.5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-[13px] font-bold text-white line-clamp-1 group-hover:text-[#ed1c24] transition" title={item.title}>
                {item.title}
              </h4>
              {!isShow && item.watchCount > 1 && (
                <span className="text-[10px] font-bold bg-[#ed1c24]/20 text-[#ed1c24] border border-[#ed1c24]/30 px-1.5 py-0.5 rounded shrink-0">
                  {item.watchCount}x tonton
                </span>
              )}
            </div>

            {isShow ? (
              <p className="text-xs text-[#7e8d9f] mt-1 line-clamp-1">
                <span className="font-semibold text-rose-300">
                  Musim {item.seasons.sort((a, b) => a - b).join(', ')}
                </span>
                <span className="text-[#a4b3c4]"> • {item.episodesCount} episode ({item.formattedHours})</span>
              </p>
            ) : (
              <p className="text-xs text-emerald-400 font-semibold mt-1">
                Film • {item.totalMinutes} menit
              </p>
            )}
          </div>

          {/* Genres */}
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

          {/* Episode Breakdown Accordion for Series */}
          {isShow && item.episodes.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[#1b2335]">
              <button
                type="button"
                onClick={() => setExpandedShowKey(isExpanded ? null : item.key)}
                className="w-full py-1.5 px-2.5 rounded-lg bg-[#0e131f] hover:bg-[#161d2d] border border-[#1d273a] text-[11px] font-semibold text-[#8e9cae] hover:text-white transition flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#ed1c24]" />
                  <span>Daftar {item.episodesCount} Episode Ditonton</span>
                </span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-white" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isExpanded && (
                <div className="mt-2 p-2 bg-[#080b11] rounded-lg border border-[#1b2234] max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {item.episodes.map((ep) => (
                    <div
                      key={ep.id}
                      className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-[#121622] text-[11px] transition"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-white text-[10px] bg-[#1a2130] px-1.5 py-0.5 rounded border border-[#263147] mr-1.5 shrink-0">
                          M{ep.season_number}•E{ep.episode_number}
                        </span>
                        <span className="text-[#a4b3c4] truncate" title={ep.episode_title || ''}>
                          {ep.episode_title || `Episode ${ep.episode_number}`}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#637286] shrink-0">
                        {new Date(ep.watched_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#090c13] text-[#f0f3f8] antialiased relative">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#1b2234] bg-[#0c101a]/95 backdrop-blur-md px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.svg" 
              alt="TraktLens" 
              className="w-8 h-8 rounded-lg shadow-md shadow-[#ed1c24]/40 shrink-0" 
            />
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
                  v0.3.0
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
          <section className="bg-[#10141f] border border-[#1c2436] rounded-2xl p-5 lg:p-6 space-y-4 shadow-xl shadow-black/30">
            {/* Header with Title & Year Toggle Pills */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1b2234] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#ed1c24]/10 border border-[#ed1c24]/30 text-[#ed1c24]">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <span>Fakta Unik & Rekor Tontonan</span>
                    </h2>
                    {selectedYear ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#ed1c24]/20 text-[#ed1c24] border border-[#ed1c24]/40 uppercase tracking-wider flex items-center gap-1 shadow-sm shadow-[#ed1c24]/20 animate-pulse">
                        <Calendar className="w-3 h-3" />
                        <span>Tahun {selectedYear} • Year in Review</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#1c2538] text-[#8e9cae] border border-[#2b374e] uppercase tracking-wider">
                        Sepanjang Masa (All-Time)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#79889b] mt-0.5">
                    {selectedYear 
                      ? `Statistik superlatif dan rekor tontonan personal Anda khusus sepanjang tahun ${selectedYear}`
                      : 'Statistik superlatif film terpanjang, serial terfavorit, rewatch, dan kebiasaan menonton Anda'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFunFacts(!showFunFacts)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a27] hover:bg-[#1e273b] border border-[#232d42] text-xs font-semibold text-[#8e9cae] hover:text-white transition cursor-pointer"
                >
                  <span>{showFunFacts ? 'Sembunyikan' : 'Tampilkan'}</span>
                  {showFunFacts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Year Selector Tabs directly inside Fakta Unik */}
            {showFunFacts && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 pb-1 border-b border-[#161d2d]">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-thin">
                    <span className="text-[11px] font-bold text-[#768496] uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-[#ed1c24]" />
                      <span>Rekor Tahun:</span>
                    </span>

                    {/* All-time pill */}
                    <button
                      onClick={() => handlePreset('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        !selectedYear
                          ? 'bg-[#ed1c24] text-white shadow-md shadow-[#ed1c24]/30'
                          : 'bg-[#141a27] text-[#8e9cae] hover:text-white hover:bg-[#1e273b] border border-[#222c3f]'
                      }`}
                    >
                      <span>Semua Waktu</span>
                    </button>

                    {/* Available Years Pills */}
                    {displayYears.map(yr => {
                      const isSelected = selectedYear === yr;
                      const yrData = yearlyBreakdown.find(y => y.year === yr);
                      return (
                        <button
                          key={yr}
                          onClick={() => handleYear(yr)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-[#ed1c24] text-white shadow-md shadow-[#ed1c24]/30'
                              : 'bg-[#141a27] text-[#8e9cae] hover:text-white hover:bg-[#1e273b] border border-[#222c3f]'
                          }`}
                        >
                          <span>{yr}</span>
                          {yrData && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isSelected ? 'bg-white/20 text-white' : 'bg-[#1e273b] text-[#6b7b92]'}`}>
                              {yrData.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {selectedYear && (
                    <button
                      onClick={() => handlePreset('all')}
                      className="text-xs text-[#ed1c24] hover:text-[#ff3b42] flex items-center gap-1 font-semibold cursor-pointer shrink-0 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset ke Rekor Semua Waktu</span>
                    </button>
                  )}
                </div>

                {/* If selected year, show a highlight banner */}
                {selectedYear && (
                  <div className="bg-gradient-to-r from-[#ed1c24]/15 via-[#161c2b] to-[#121622] p-3 rounded-xl border border-[#ed1c24]/30 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#ed1c24] shrink-0" />
                      <span className="text-xs text-[#d0dbe9]">
                        Menampilkan rekor tontonan terpanjang, serial terfavorit, rewatch, dan kebiasaan menonton Anda di <strong>Tahun {selectedYear}</strong> ({summary ? `${summary.totalItems} tontonan` : '0 tontonan'}).
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-white bg-[#ed1c24]/20 border border-[#ed1c24]/40 px-3 py-1 rounded-full">
                      {summary ? summary.formattedDuration : '0m'} total tontonan di {selectedYear}
                    </span>
                  </div>
                )}
              </div>
            )}

            {showFunFacts && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {/* 1. Top 3 Film Terpanjang */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col hover:border-[#ed1c24]/50 transition shadow-lg shadow-black/20 group">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-[#ed1c24]" />
                      <span>Top 3 Film Terpanjang</span>
                    </span>
                    {funFacts.avgMovieRuntime ? (
                      <span className="text-[10px] text-[#8e9cae] font-medium bg-[#161c29] px-2 py-0.5 rounded border border-[#242f44]">
                        Rata-rata: <strong className="text-white">{funFacts.avgMovieRuntime}m</strong>
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#52637a] font-medium">Durasi Maksimal</span>
                    )}
                  </div>

                  {funFacts.topLongestMovies && funFacts.topLongestMovies.length > 0 ? (
                    <div className="space-y-2 flex-1 flex flex-col justify-between">
                      {funFacts.topLongestMovies.map((movie, idx) => {
                        const rankStyles = [
                          { badge: '#1 TERPANJANG', text: 'text-[#ed1c24]', border: 'border-[#ed1c24]/30 hover:border-[#ed1c24]/60' },
                          { badge: '#2 TERPANJANG', text: 'text-amber-400', border: 'border-[#1a2233] hover:border-[#2b3952]' },
                          { badge: '#3 TERPANJANG', text: 'text-orange-400', border: 'border-[#1a2233] hover:border-[#2b3952]' },
                        ];
                        const style = rankStyles[idx] || rankStyles[2];
                        return (
                          <div key={movie.title + idx} className={`flex items-center gap-3 bg-[#0a0d14] p-2.5 rounded-lg border ${style.border} transition`}>
                            {movie.poster_url ? (
                              <img 
                                src={movie.poster_url} 
                                alt={movie.title}
                                className="w-10 h-14 object-cover rounded shadow shrink-0" 
                              />
                            ) : (
                              <div className="w-10 h-14 bg-[#1b2234] rounded flex items-center justify-center shrink-0">
                                <Film className="w-5 h-5 text-[#4e5f78]" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className={`text-[9px] font-extrabold ${style.text} uppercase tracking-wider block`}>
                                {style.badge} ({movie.formattedDuration})
                              </span>
                              <h4 className="text-xs font-bold text-white truncate" title={movie.title}>
                                {movie.title}
                              </h4>
                              <span className="text-[10px] text-[#79889b]">
                                {movie.runtimeMinutes} menit • {movie.genres?.slice(0, 2).join(', ') || 'Film'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#52637a] py-8 text-center my-auto">Belum ada data film di rentang ini</p>
                  )}
                </div>

                {/* 2. Top 3 Film Terpendek */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col hover:border-emerald-500/50 transition shadow-lg shadow-black/20 group">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Top 3 Film Terpendek</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Paling Singkat
                    </span>
                  </div>

                  {funFacts.topShortestMovies && funFacts.topShortestMovies.length > 0 ? (
                    <div className="space-y-2 flex-1 flex flex-col justify-between">
                      {funFacts.topShortestMovies.map((movie, idx) => {
                        const rankStyles = [
                          { badge: '#1 TERPENDEK', text: 'text-emerald-400', border: 'border-emerald-500/30 hover:border-emerald-500/60' },
                          { badge: '#2 TERPENDEK', text: 'text-teal-400', border: 'border-[#1a2233] hover:border-[#2b3952]' },
                          { badge: '#3 TERPENDEK', text: 'text-cyan-400', border: 'border-[#1a2233] hover:border-[#2b3952]' },
                        ];
                        const style = rankStyles[idx] || rankStyles[2];
                        return (
                          <div key={movie.title + idx} className={`flex items-center gap-3 bg-[#0a0d14] p-2.5 rounded-lg border ${style.border} transition`}>
                            {movie.poster_url ? (
                              <img 
                                src={movie.poster_url} 
                                alt={movie.title}
                                className="w-10 h-14 object-cover rounded shadow shrink-0" 
                              />
                            ) : (
                              <div className="w-10 h-14 bg-[#1b2234] rounded flex items-center justify-center shrink-0">
                                <Film className="w-5 h-5 text-[#4e5f78]" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className={`text-[9px] font-extrabold ${style.text} uppercase tracking-wider block`}>
                                {style.badge} ({movie.formattedDuration})
                              </span>
                              <h4 className="text-xs font-bold text-white truncate" title={movie.title}>
                                {movie.title}
                              </h4>
                              <span className="text-[10px] text-[#79889b]">
                                {movie.runtimeMinutes} menit • {movie.genres?.slice(0, 2).join(', ') || 'Film Pendek'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#52637a] py-8 text-center my-auto">Belum ada data film di rentang ini</p>
                  )}
                </div>

                {/* 3. Series Paling Banyak Ditonton (Binge Champion) */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col hover:border-indigo-500/50 transition shadow-lg shadow-black/20 group">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Serial Terfavorit (Top Series)</span>
                    </span>
                    <div className="flex items-center bg-[#0a0d14] p-0.5 rounded-lg border border-[#1e273b]">
                      <button
                        onClick={() => setSeriesRankBy('episodes')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
                          seriesRankBy === 'episodes'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-[#6b7b92] hover:text-[#94a3b8]'
                        }`}
                        title="Urutkan berdasarkan jumlah episode terbanyak"
                      >
                        Jumlah Eps
                      </button>
                      <button
                        onClick={() => setSeriesRankBy('duration')}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
                          seriesRankBy === 'duration'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-[#6b7b92] hover:text-[#94a3b8]'
                        }`}
                        title="Urutkan berdasarkan total waktu tonton terlama"
                      >
                        Waktu Terlama
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const activeShows = (seriesRankBy === 'episodes'
                      ? (funFacts.topShowsByEpisodes && funFacts.topShowsByEpisodes.length > 0 ? funFacts.topShowsByEpisodes : funFacts.topShows)
                      : (funFacts.topShowsByDuration && funFacts.topShowsByDuration.length > 0 ? funFacts.topShowsByDuration : funFacts.topShows)) || [];

                    if (!activeShows || activeShows.length === 0) {
                      return <p className="text-xs text-[#52637a] py-8 text-center my-auto">Belum ada serial di rentang ini</p>;
                    }

                    const topShow = activeShows[0];
                    const isEp = seriesRankBy === 'episodes';

                    return (
                      <div className="space-y-2 flex-1 flex flex-col justify-between">
                        {/* Rank 1 Feature */}
                        <div className="flex items-center gap-3 bg-[#0a0d14] p-2.5 rounded-lg border border-indigo-500/30 hover:border-indigo-500/60 transition">
                          {topShow.poster_url ? (
                            <img 
                              src={topShow.poster_url} 
                              alt={topShow.title}
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
                                {isEp ? `${topShow.episodes} Episode` : `${topShow.formattedDuration} Menonton`}
                              </span>
                            </div>
                            <h4 className="text-xs font-bold text-white truncate mt-0.5" title={topShow.title}>
                              {topShow.title}
                            </h4>
                            <span className="text-[10px] text-[#79889b]">
                              {isEp
                                ? `Total ${topShow.formattedDuration} menonton`
                                : `${topShow.episodes} episode ditonton`}
                            </span>
                          </div>
                        </div>

                        {/* Rank 2, 3, 4, 5 with mini relative progress bars */}
                        <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                          {activeShows.slice(1, 5).map((show, idx) => {
                            const maxVal = isEp ? (topShow.episodes || 1) : (topShow.runtimeMinutes || 1);
                            const curVal = isEp ? show.episodes : show.runtimeMinutes;
                            const pct = Math.round((curVal / maxVal) * 100);

                            return (
                              <div key={show.title} className="relative overflow-hidden rounded bg-[#0e121b] border border-[#182030] p-1.5 hover:border-indigo-500/30 transition">
                                <div 
                                  className="absolute left-0 top-0 bottom-0 bg-indigo-500/10 pointer-events-none transition-all duration-500" 
                                  style={{ width: `${pct}%` }}
                                />
                                <div className="relative flex items-center justify-between text-xs px-1">
                                  <div className="flex items-center gap-2 min-w-0 pr-2">
                                    <span className="text-[10px] font-bold text-[#5c6e88] w-4">#{idx + 2}</span>
                                    <span className="text-white font-medium truncate text-xs" title={show.title}>
                                      {show.title}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-semibold text-indigo-300 shrink-0">
                                    {isEp ? (
                                      <>{show.episodes} ep <span className="text-[#64748b]">({show.formattedDuration})</span></>
                                    ) : (
                                      <>{show.formattedDuration} <span className="text-[#64748b]">({show.episodes} ep)</span></>
                                    )}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 3. Film yang Ditonton Lebih Dari Sekali (Rewatch) */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col hover:border-emerald-500/50 transition shadow-lg shadow-black/20 group">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ditonton Lebih dari Sekali</span>
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Total: {funFacts.totalRewatchCount || 0}x Rewatch
                    </span>
                  </div>

                  {funFacts.rewatchedMovies && funFacts.rewatchedMovies.length > 0 ? (
                    <div className="space-y-2 flex-1 flex flex-col justify-between">
                      {funFacts.rewatchedMovies.map((movie, idx) => {
                        const rankBadges = [
                          { badge: '🥇 #1', border: 'border-amber-500/40 text-amber-300' },
                          { badge: '🥈 #2', border: 'border-slate-400/40 text-slate-300' },
                          { badge: '🥉 #3', border: 'border-amber-700/40 text-amber-500' },
                          { badge: '🎖️ #4', border: 'border-emerald-500/30 text-emerald-300' },
                        ];
                        const rankStyle = rankBadges[idx] || rankBadges[3];
                        return (
                          <div key={movie.title} className="flex items-center justify-between bg-[#0a0d14] p-2.5 rounded-lg border border-[#1a2233] hover:border-emerald-500/30 transition">
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              {movie.poster_url ? (
                                <img src={movie.poster_url} alt={movie.title} className="w-7 h-10 object-cover rounded shrink-0 shadow" />
                              ) : (
                                <div className="w-7 h-10 bg-[#1b2234] rounded flex items-center justify-center shrink-0">
                                  <Film className="w-3.5 h-3.5 text-[#52637a]" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] font-bold ${rankStyle.border}`}>
                                    {rankStyle.badge}
                                  </span>
                                  <h4 className="text-xs font-bold text-white truncate" title={movie.title}>
                                    {movie.title}
                                  </h4>
                                </div>
                                <span className="text-[10px] text-[#79889b]">
                                  {movie.totalDuration ? `Total ${movie.totalDuration} durasi` : 'Film diputar berulang'}
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-1 rounded-md text-[11px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                              {movie.count}x Ditonton
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-[#0a0d14] p-4 rounded-lg border border-[#1a2233] text-center my-auto">
                      <Repeat className="w-6 h-6 text-[#354359] mx-auto mb-1.5" />
                      <p className="text-xs text-[#8e9cae] font-medium">Belum Ada Rewatch</p>
                      <p className="text-[10px] text-[#52637a] mt-0.5">Semua judul film di rentang ini baru ditonton 1 kali.</p>
                    </div>
                  )}
                </div>

                {/* 4. Rasio Format Tontonan (Film vs Serial) */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col hover:border-cyan-500/50 transition shadow-lg shadow-black/20 group">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <PieChart className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Rasio Film vs Serial</span>
                    </span>
                    <span className="text-[10px] text-cyan-400 font-medium">Volume & Jam</span>
                  </div>

                  {funFacts.watchRatio ? (
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      {/* Dual Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-xs font-bold text-[#ed1c24] flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#ed1c24]"></span>
                            <span>Film ({funFacts.watchRatio.moviePercentCount}%)</span>
                          </span>
                          <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                            <span>Episode Serial ({funFacts.watchRatio.episodePercentCount}%)</span>
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          </span>
                        </div>
                        <div className="w-full h-3 bg-[#0a0d14] rounded-full overflow-hidden flex p-0.5 border border-[#1a2233]">
                          <div 
                            className="h-full bg-gradient-to-r from-red-600 to-[#ed1c24] rounded-l-full transition-all duration-700" 
                            style={{ width: `${funFacts.watchRatio.moviePercentCount}%` }}
                          />
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-r-full transition-all duration-700" 
                            style={{ width: `${funFacts.watchRatio.episodePercentCount}%` }}
                          />
                        </div>
                      </div>

                      {/* 2 Comparison Cards */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#0a0d14] p-2.5 rounded-lg border border-[#ed1c24]/20">
                          <span className="text-[10px] font-bold text-[#768496] uppercase tracking-wider block">Film</span>
                          <div className="text-base font-extrabold text-white mt-0.5">{funFacts.watchRatio.movieCount.toLocaleString()}</div>
                          <span className="text-[10px] text-[#ed1c24] font-medium block mt-0.5">
                            {funFacts.watchRatio.movieFormattedHours} ({funFacts.watchRatio.moviePercentDuration}% durasi)
                          </span>
                        </div>

                        <div className="bg-[#0a0d14] p-2.5 rounded-lg border border-indigo-500/20">
                          <span className="text-[10px] font-bold text-[#768496] uppercase tracking-wider block">Episode TV</span>
                          <div className="text-base font-extrabold text-white mt-0.5">{funFacts.watchRatio.episodeCount.toLocaleString()}</div>
                          <span className="text-[10px] text-indigo-400 font-medium block mt-0.5">
                            {funFacts.watchRatio.episodeFormattedHours} ({funFacts.watchRatio.episodePercentDuration}% durasi)
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#79889b] bg-[#0a0d14] p-2 rounded-lg border border-[#182030] text-center">
                        Rasio rata-rata: <strong className="text-white">1 film</strong> untuk setiap <strong className="text-indigo-400">~{Math.round(funFacts.watchRatio.episodeCount / (funFacts.watchRatio.movieCount || 1))} episode serial</strong>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* 5. Ritme Menonton Mingguan (Senin - Minggu Chart) */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col hover:border-purple-500/50 transition shadow-lg shadow-black/20 group">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                      <span>Ritme Menonton 7 Hari</span>
                    </span>
                    <span className="text-[10px] text-purple-300 font-medium bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      Puncak: {funFacts.busiestDay.day} ({funFacts.busiestDay.percent || 36}%)
                    </span>
                  </div>

                  {funFacts.dayOfWeekStats && funFacts.dayOfWeekStats.length > 0 ? (
                    <div className="space-y-3 flex-1 flex flex-col justify-between">
                      {/* Mini Bar Chart */}
                      <div className="flex items-end justify-between gap-1.5 h-28 pt-4 px-1">
                        {funFacts.dayOfWeekStats.map((d) => {
                          const isPeak = d.fullName === funFacts.busiestDay.day;
                          return (
                            <div key={d.shortName} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group/bar">
                              <span className={`text-[9px] font-bold ${isPeak ? 'text-purple-300' : 'text-[#52637a]'} group-hover/bar:text-white transition`}>
                                {d.count}
                              </span>
                              <div className="w-full bg-[#0a0d14] rounded-t overflow-hidden flex flex-col justify-end h-16 border border-[#182030]">
                                <div 
                                  className={`w-full rounded-t transition-all duration-700 ${
                                    isPeak 
                                      ? 'bg-gradient-to-t from-purple-600 to-indigo-400 shadow-md shadow-purple-500/40' 
                                      : 'bg-gradient-to-t from-[#1b2234] to-[#2b374e] group-hover/bar:from-purple-900 group-hover/bar:to-purple-500'
                                  }`}
                                  style={{ height: `${d.relativeHeight}%` }}
                                />
                              </div>
                              <span className={`text-[10px] font-semibold ${isPeak ? 'text-purple-400 font-bold' : 'text-[#79889b]'}`}>
                                {d.shortName}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-[11px] text-[#79889b] bg-[#0a0d14] p-2 rounded-lg border border-[#182030] text-center flex items-center justify-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Hari <strong>{funFacts.busiestDay.day}</strong> menyumbang tontonan terbanyak ({funFacts.busiestDay.count.toLocaleString()} aktivitas).</span>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* 6. Jam Emas Menonton (4 Kuadran Waktu) */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col hover:border-amber-500/50 transition shadow-lg shadow-black/20 group">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Jam Emas Menonton (WIB)</span>
                    </span>
                    <span className="text-[10px] text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Puncak: {funFacts.peakHour.formatted}
                    </span>
                  </div>

                  {funFacts.timeOfDayStats ? (
                    <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                      {/* 4 Quadrants Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Pagi */}
                        <div className="bg-[#0a0d14] p-2.5 rounded-lg border border-[#182030] flex flex-col justify-between hover:border-amber-500/30 transition">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#768496] flex items-center gap-1">
                              <Sun className="w-3 h-3 text-amber-400" />
                              <span>Pagi (05-12)</span>
                            </span>
                            <span className="text-[10px] font-extrabold text-amber-400">{funFacts.timeOfDayStats.morning.percent}%</span>
                          </div>
                          <span className="text-[11px] font-bold text-white mt-1.5">{funFacts.timeOfDayStats.morning.count.toLocaleString()} tontonan</span>
                        </div>

                        {/* Siang */}
                        <div className="bg-[#0a0d14] p-2.5 rounded-lg border border-[#182030] flex flex-col justify-between hover:border-amber-500/30 transition">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#768496] flex items-center gap-1">
                              <Sun className="w-3 h-3 text-orange-400" />
                              <span>Siang (12-18)</span>
                            </span>
                            <span className="text-[10px] font-extrabold text-orange-400">{funFacts.timeOfDayStats.afternoon.percent}%</span>
                          </div>
                          <span className="text-[11px] font-bold text-white mt-1.5">{funFacts.timeOfDayStats.afternoon.count.toLocaleString()} tontonan</span>
                        </div>

                        {/* Malam / Prime Time (Leader) */}
                        <div className="bg-[#0a0d14] p-2.5 rounded-lg border border-purple-500/30 flex flex-col justify-between relative overflow-hidden">
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-500"></div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-purple-300 flex items-center gap-1">
                              <Moon className="w-3 h-3 text-purple-400" />
                              <span>Malam (18-24)</span>
                            </span>
                            <span className="text-[10px] font-black text-purple-400">{funFacts.timeOfDayStats.evening.percent}% 🔥</span>
                          </div>
                          <span className="text-[11px] font-extrabold text-white mt-1.5">{funFacts.timeOfDayStats.evening.count.toLocaleString()} tontonan</span>
                        </div>

                        {/* Begadang */}
                        <div className="bg-[#0a0d14] p-2.5 rounded-lg border border-[#182030] flex flex-col justify-between hover:border-indigo-500/30 transition">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#768496] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-indigo-400" />
                              <span>Begadang (00-05)</span>
                            </span>
                            <span className="text-[10px] font-extrabold text-indigo-400">{funFacts.timeOfDayStats.night.percent}%</span>
                          </div>
                          <span className="text-[11px] font-bold text-white mt-1.5">{funFacts.timeOfDayStats.night.count.toLocaleString()} tontonan</span>
                        </div>
                      </div>

                      <div className="bg-[#0a0d14] p-2 rounded-lg border border-[#182030] flex items-center justify-between text-xs">
                        <span className="text-[#8e9cae]">Persona Nonton:</span>
                        <span className="font-extrabold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                          {funFacts.peakHour.persona}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* 7. Rekor Maraton Tergila (Single-Day Binge) */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col hover:border-amber-500/50 transition shadow-lg shadow-black/20 group">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Rekor Maraton 24 Jam</span>
                    </span>
                    <span className="text-[10px] text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Nonstop Binge
                    </span>
                  </div>

                  {funFacts.recordBingeDay && funFacts.recordBingeDay.realBinge ? (
                    <div className="space-y-2 flex-1 flex flex-col justify-between">
                      <div className="bg-[#0a0d14] p-3 rounded-lg border border-amber-500/20 relative overflow-hidden group/binge">
                        <div className="absolute top-0 right-0 p-2 text-amber-500/10 group-hover/binge:text-amber-500/20 transition">
                          <Flame className="w-14 h-14" />
                        </div>
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">
                          Tontonan Terbanyak dalam 1 Hari Realistis
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl lg:text-3xl font-black text-white">{funFacts.recordBingeDay.realBinge.count}</span>
                          <span className="text-xs font-semibold text-[#8e9cae]">episode / film selesai</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[#1a2233] flex items-center justify-between text-xs">
                          <span className="text-[#a0afc2] font-semibold">{funFacts.recordBingeDay.realBinge.formattedDate}</span>
                          <span className="text-amber-400 font-bold">{funFacts.recordBingeDay.realBinge.formattedDuration} total</span>
                        </div>
                      </div>

                      {funFacts.recordBingeDay.allTimeMaxDay && (
                        <div className="text-[10px] text-[#768496] bg-[#0a0d14] p-2 rounded-lg border border-[#182030] flex items-center justify-between">
                          <span>📦 Rekor Impor/Sinkron Akun:</span>
                          <strong className="text-white">{funFacts.recordBingeDay.allTimeMaxDay.count} item ({funFacts.recordBingeDay.allTimeMaxDay.formattedDate})</strong>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[#52637a] py-8 text-center my-auto">Belum ada rekor maraton</p>
                  )}
                </div>

                {/* 8. Top Genre Leaderboard */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col hover:border-sky-500/50 transition shadow-lg shadow-black/20 group">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-sky-400" />
                      <span>Genre Paling Mendominasi</span>
                    </span>
                    <span className="text-[10px] text-[#52637a] font-medium">Top Categories</span>
                  </div>

                  {summary && summary.genresBreakdown.length > 0 ? (
                    <div className="space-y-2 flex-1 flex flex-col justify-between">
                      {summary.genresBreakdown.slice(0, 5).map(([genreName, count], idx) => {
                        const topCount = summary.genresBreakdown[0][1] || 1;
                        const pct = Math.round((count / topCount) * 100);
                        const colors = [
                          'from-red-500 to-amber-500',
                          'from-sky-500 to-indigo-500',
                          'from-purple-500 to-pink-500',
                          'from-emerald-500 to-teal-500',
                          'from-amber-500 to-orange-500'
                        ];
                        const barColor = colors[idx % colors.length];
                        return (
                          <div key={genreName} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-white flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-[#5c6e88]">#{idx + 1}</span>
                                <span className="capitalize">{genreName}</span>
                              </span>
                              <span className="text-[10px] font-bold text-sky-300">{count.toLocaleString()} item</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#0a0d14] rounded-full overflow-hidden border border-[#1b2234]">
                              <div 
                                className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-500`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#52637a] py-8 text-center my-auto">Belum ada kategori tontonan</p>
                  )}
                </div>

                {/* 9. Milestone & Jejak Akun Trakt */}
                <div className="bg-[#121622] border border-[#1e273b] rounded-xl p-4 flex flex-col hover:border-rose-500/50 transition shadow-lg shadow-black/20 group">
                  <div className="flex items-center justify-between border-b border-[#1b2234] pb-2.5 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8e9cae] flex items-center gap-1.5">
                      <Milestone className="w-3.5 h-3.5 text-rose-400" />
                      <span>Jejak & Milestone Akun</span>
                    </span>
                    <span className="text-[10px] text-rose-300 font-medium bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {funFacts.timelineMilestone?.yearsSpan ? `${funFacts.timelineMilestone.yearsSpan}+ Tahun Jejak` : 'Timeline'}
                    </span>
                  </div>

                  {funFacts.timelineMilestone ? (
                    <div className="space-y-2.5 flex-1 flex flex-col justify-between">
                      {/* First Item */}
                      {funFacts.timelineMilestone.firstWatched && (
                        <div className="flex items-center gap-3 bg-[#0a0d14] p-2.5 rounded-lg border border-[#1a2233]">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400 text-xs font-bold">
                            🏁
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">
                              Tontonan Terlama Tercatat
                            </span>
                            <h4 className="text-xs font-bold text-white truncate" title={funFacts.timelineMilestone.firstWatched.show_title || funFacts.timelineMilestone.firstWatched.title}>
                              {funFacts.timelineMilestone.firstWatched.show_title || funFacts.timelineMilestone.firstWatched.title}
                            </h4>
                            {funFacts.timelineMilestone.firstWatched.type === 'episode' && (
                              <p className="text-[11px] text-[#8e9cae] truncate mt-0.5" title={`Season ${funFacts.timelineMilestone.firstWatched.season_number ?? 1} • Eps ${funFacts.timelineMilestone.firstWatched.episode_number ?? 1}${funFacts.timelineMilestone.firstWatched.episode_title ? ` - ${funFacts.timelineMilestone.firstWatched.episode_title}` : ''}`}>
                                <span className="font-semibold text-emerald-400">
                                  Season {funFacts.timelineMilestone.firstWatched.season_number ?? 1} • Eps {funFacts.timelineMilestone.firstWatched.episode_number ?? 1}
                                </span>
                                {funFacts.timelineMilestone.firstWatched.episode_title && (
                                  <span className="text-[#c4d1e0]"> - {funFacts.timelineMilestone.firstWatched.episode_title}</span>
                                )}
                              </p>
                            )}
                            <span className="text-[10px] text-[#79889b] block mt-0.5">
                              {funFacts.timelineMilestone.firstWatched.formattedDate} • {funFacts.timelineMilestone.firstWatched.type === 'movie' ? 'Film' : 'Episode'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Latest Item */}
                      {funFacts.timelineMilestone.latestWatched && (
                        <div className="flex items-center gap-3 bg-[#0a0d14] p-2.5 rounded-lg border border-[#1a2233]">
                          <div className="w-8 h-8 rounded-full bg-[#ed1c24]/10 border border-[#ed1c24]/30 flex items-center justify-center shrink-0 text-[#ed1c24] text-xs font-bold">
                            📍
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-bold text-[#ed1c24] uppercase tracking-wider block">
                              Tontonan Paling Baru
                            </span>
                            <h4 className="text-xs font-bold text-white truncate" title={funFacts.timelineMilestone.latestWatched.show_title || funFacts.timelineMilestone.latestWatched.title}>
                              {funFacts.timelineMilestone.latestWatched.show_title || funFacts.timelineMilestone.latestWatched.title}
                            </h4>
                            {funFacts.timelineMilestone.latestWatched.type === 'episode' && (
                              <p className="text-[11px] text-[#8e9cae] truncate mt-0.5" title={`Season ${funFacts.timelineMilestone.latestWatched.season_number ?? 1} • Eps ${funFacts.timelineMilestone.latestWatched.episode_number ?? 1}${funFacts.timelineMilestone.latestWatched.episode_title ? ` - ${funFacts.timelineMilestone.latestWatched.episode_title}` : ''}`}>
                                <span className="font-semibold text-[#ed1c24]">
                                  Season {funFacts.timelineMilestone.latestWatched.season_number ?? 1} • Eps {funFacts.timelineMilestone.latestWatched.episode_number ?? 1}
                                </span>
                                {funFacts.timelineMilestone.latestWatched.episode_title && (
                                  <span className="text-[#c4d1e0]"> - {funFacts.timelineMilestone.latestWatched.episode_title}</span>
                                )}
                              </p>
                            )}
                            <span className="text-[10px] text-[#79889b] block mt-0.5">
                              {funFacts.timelineMilestone.latestWatched.formattedDate} • {funFacts.timelineMilestone.latestWatched.type === 'movie' ? 'Film' : 'Episode'}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="text-[10px] text-[#768496] bg-[#0a0d14] p-2 rounded-lg border border-[#182030] text-center">
                        Total <strong className="text-white">{summary ? summary.totalItems.toLocaleString() : '4,444'} tontonan</strong> terarsip rapi di TraktLens.
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#52637a] py-8 text-center my-auto">Belum ada jejak tontonan</p>
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

          {/* Search Bar + View Mode Toggle + Drawer Trigger */}
          <div className="pt-3 border-t border-[#1b2234] flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
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

            {/* View Mode Toggle: Per Hari vs Semua Log vs Rekap Judul */}
            <div className="flex items-center bg-[#090c13] border border-[#1f283d] rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => handleSetViewMode('daily')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'daily'
                    ? 'bg-[#ed1c24] text-white shadow-md shadow-[#ed1c24]/30'
                    : 'text-[#8291a4] hover:text-white hover:bg-[#151c2a]'
                }`}
                title="Tampilkan riwayat log dipisah per hari"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Per Hari</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('flat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'flat'
                    ? 'bg-[#ed1c24] text-white shadow-md shadow-[#ed1c24]/30'
                    : 'text-[#8291a4] hover:text-white hover:bg-[#151c2a]'
                }`}
                title="Tampilkan semua log tanpa dipisah per hari"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Semua Log</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('recap')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'recap'
                    ? 'bg-[#ed1c24] text-white shadow-md shadow-[#ed1c24]/30 font-bold'
                    : 'text-[#8291a4] hover:text-white hover:bg-[#151c2a]'
                }`}
                title="Highlight & Rekap Judul: Serial terkelompok jadi 1 kartu per judul + Film normal"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold">Rekap Judul</span>
              </button>
            </div>

            {/* Trakt Filter Drawer Trigger Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border shrink-0 ${
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

        {/* Media Grid & Recap Section */}
        <section className="space-y-6">
          {/* Quick Banner to switch to Recap when viewing Daily or Flat */}
          {viewMode !== 'recap' && filteredItems.length > 0 && recapData.items.length > 0 && (
            <div className="bg-[#101522] border border-[#1e273b] hover:border-[#ed1c24]/40 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 transition shadow-md shadow-black/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#ed1c24]/10 text-[#ed1c24] border border-[#ed1c24]/20 shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs font-bold text-white">
                      Highlight Rekap: {recapData.items.length} Judul Tontonan
                    </h3>
                    <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 font-semibold">
                      {recapData.totalShows} Series ({recapData.totalEpisodes} Eps) • {recapData.totalMovies} Film
                    </span>
                  </div>
                  <p className="text-[11px] text-[#78889c] mt-0.5">
                    Ingin melihat ringkasan di mana series digabung menjadi 1 kartu per judul?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSetViewMode('recap')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#ed1c24] text-white hover:bg-[#d0141c] transition shadow-md shadow-[#ed1c24]/30 cursor-pointer shrink-0"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Buka Rekap Judul</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="bg-[#121622] border border-[#1d2537] rounded-xl p-12 text-center shadow-lg shadow-black/20">
              <PlayCircle className="w-12 h-12 text-[#3b475e] mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Tidak Ada Data Tontonan</h3>
              <p className="text-xs text-[#79889b] max-w-md mx-auto mt-1">
                Tidak ada riwayat tontonan yang sesuai dengan filter. Coba ubah rentang tanggal atau klik tombol <b>Semua</b>.
              </p>
            </div>
          ) : viewMode === 'recap' ? (
            /* Tampilan Highlight & Rekap Judul */
            <div className="space-y-6">
              {/* Header Bar Rekap */}
              <div className="bg-[#121622] border border-[#1d2537] rounded-xl p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-black/20">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#ed1c24]" />
                      <span>Highlight & Rekap Judul</span>
                    </h2>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ed1c24]/10 text-[#ed1c24] border border-[#ed1c24]/30">
                      {activePeriodLabel}
                    </span>
                  </div>
                  <p className="text-xs text-[#79889b] mt-1">
                    Ringkasan tontonan terkelompok: <strong className="text-white">{recapData.totalShows} Series</strong> ({recapData.totalEpisodes} episode) dan <strong className="text-white">{recapData.totalMovies} Film</strong>.
                  </p>
                </div>

                {/* Sub-Filter Tabs & Sort */}
                <div className="flex items-center flex-wrap gap-2.5">
                  <div className="flex items-center bg-[#090c13] border border-[#1e273b] p-1 rounded-xl">
                    <button
                      onClick={() => setRecapTypeFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        recapTypeFilter === 'all'
                          ? 'bg-[#ed1c24] text-white shadow-sm shadow-[#ed1c24]/30'
                          : 'text-[#7e8d9f] hover:text-white'
                      }`}
                    >
                      Semua ({recapData.items.length})
                    </button>
                    <button
                      onClick={() => setRecapTypeFilter('show')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        recapTypeFilter === 'show'
                          ? 'bg-[#ed1c24] text-white shadow-sm shadow-[#ed1c24]/30'
                          : 'text-[#7e8d9f] hover:text-white'
                      }`}
                    >
                      <Tv className="w-3.5 h-3.5" />
                      <span>Series ({recapData.totalShows})</span>
                    </button>
                    <button
                      onClick={() => setRecapTypeFilter('movie')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        recapTypeFilter === 'movie'
                          ? 'bg-[#ed1c24] text-white shadow-sm shadow-[#ed1c24]/30'
                          : 'text-[#7e8d9f] hover:text-white'
                      }`}
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Film ({recapData.totalMovies})</span>
                    </button>
                  </div>

                  <select
                    value={recapSort}
                    onChange={(e) => setRecapSort(e.target.value as any)}
                    className="px-3 py-1.5 bg-[#090c13] border border-[#1e273b] rounded-xl text-xs text-[#a0afc2] focus:border-[#ed1c24] outline-none cursor-pointer"
                  >
                    <option value="latest">Terbaru Ditonton</option>
                    <option value="count_desc">Episode / Tontonan Terbanyak</option>
                    <option value="duration_desc">Durasi Terlama</option>
                    <option value="title_asc">Judul (A - Z)</option>
                  </select>
                </div>
              </div>

              {/* Grid of Recap Cards */}
              {filteredAndSortedRecap.length === 0 ? (
                <div className="bg-[#121622] border border-[#1d2537] rounded-xl p-12 text-center shadow-lg shadow-black/20">
                  <PlayCircle className="w-12 h-12 text-[#3b475e] mx-auto mb-3" />
                  <h3 className="text-base font-bold text-white">Tidak Ada Judul Ditemukan</h3>
                  <p className="text-xs text-[#79889b] max-w-md mx-auto mt-1">
                    Tidak ada judul dalam kategori ini pada rentang waktu yang dipilih.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredAndSortedRecap.map(item => renderRecapCard(item))}
                </div>
              )}
            </div>
          ) : viewMode === 'daily' ? (
            /* Mode Per Hari */
            Object.entries(groupedByDate).map(([dateLabel, groupItems]) => (
              <div key={dateLabel} className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#ed1c24]" />
                    <h2 className="text-sm font-bold text-white capitalize tracking-wide">{dateLabel}</h2>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#171d2b] border border-[#222c42] text-[#8796a8]">
                    {groupItems.length} Item
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupItems.map((item) => renderWatchCard(item, false))}
                </div>
              </div>
            ))
          ) : (
            /* Mode Semua Log (Tanpa Hari) */
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#1b2234] pb-2">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-[#ed1c24]" />
                  <h2 className="text-sm font-bold text-white tracking-wide">Semua Log (Tanpa Dipisah Hari)</h2>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#171d2b] border border-[#222c42] text-[#8796a8]">
                  {filteredItems.length} Item
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => renderWatchCard(item, true))}
              </div>
            </div>
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
              {/* 0. Format Tampilan Riwayat */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#79889b] block">
                  Format Tampilan Riwayat
                </label>
                <div className="grid grid-cols-3 gap-2 bg-[#080b11] p-1 rounded-xl border border-[#1b2234]">
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('daily')}
                    className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                      viewMode === 'daily'
                        ? 'bg-[#ed1c24] text-white shadow-sm shadow-[#ed1c24]/40' 
                        : 'text-[#7e8d9f] hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Per Hari</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('flat')}
                    className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                      viewMode === 'flat' 
                        ? 'bg-[#ed1c24] text-white shadow-sm shadow-[#ed1c24]/40' 
                        : 'text-[#7e8d9f] hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Semua Log</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('recap')}
                    className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                      viewMode === 'recap' 
                        ? 'bg-[#ed1c24] text-white shadow-sm shadow-[#ed1c24]/40' 
                        : 'text-[#7e8d9f] hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Rekap Judul</span>
                  </button>
                </div>
              </div>

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
