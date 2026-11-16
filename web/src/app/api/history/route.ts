// src/app/api/history/route.ts
import { NextResponse } from 'next/server';
import { getWatchHistory, deleteHistoryItem } from '@/lib/db';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Parameter id diperlukan' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const res = await deleteHistoryItem(id);
    return NextResponse.json(
      res,
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const type = searchParams.get('type') || undefined;
    const genre = searchParams.get('genre') || undefined;
    const sort = searchParams.get('sort') || undefined;
    const minRuntimeStr = searchParams.get('minRuntime');
    const maxRuntimeStr = searchParams.get('maxRuntime');

    const minRuntime = minRuntimeStr ? parseInt(minRuntimeStr, 10) : undefined;
    const maxRuntime = maxRuntimeStr ? parseInt(maxRuntimeStr, 10) : undefined;

    const data = await getWatchHistory({ 
      startDate, 
      endDate, 
      type, 
      genre, 
      minRuntime, 
      maxRuntime, 
      sort 
    });

    // Calculate Summary Stats
    const items = data.items;
    let movieCount = 0;
    let episodeCount = 0;
    let totalMinutes = 0;

    const uniqueShows = new Set<string>();
    const genresCount: Record<string, number> = {};

    items.forEach(it => {
      totalMinutes += it.runtime_minutes || 0;
      if (it.type === 'movie') {
        movieCount++;
      } else if (it.type === 'episode') {
        episodeCount++;
        if (it.show_slug || it.title) {
          uniqueShows.add(it.show_slug || it.title);
        }
      }

      if (Array.isArray(it.genres)) {
        it.genres.forEach(g => {
          genresCount[g] = (genresCount[g] || 0) + 1;
        });
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    // === HITUNG FAKTA UNIK & REKOR SUPERLATIF ===
    // 1. Film Terpanjang & Terpendek (Top 3 Masing-masing)
    const moviesWithRuntime = items.filter(it => it.type === 'movie' && (it.runtime_minutes || 0) > 0);
    moviesWithRuntime.sort((a, b) => (b.runtime_minutes || 0) - (a.runtime_minutes || 0));

    const totalMovieRuntime = moviesWithRuntime.reduce((acc, m) => acc + (m.runtime_minutes || 0), 0);
    const avgMovieRuntime = moviesWithRuntime.length > 0 ? Math.round(totalMovieRuntime / moviesWithRuntime.length) : 0;

    const formatMovieItem = (m: any) => ({
      title: m.title,
      slug: m.slug,
      runtimeMinutes: m.runtime_minutes,
      formattedDuration: `${Math.floor(m.runtime_minutes / 60)}j ${m.runtime_minutes % 60}m`,
      poster_url: m.poster_url || m.thumb_url || null,
      genres: m.genres || [],
    });

    const topLongestMovies = moviesWithRuntime.slice(0, 3).map(formatMovieItem);
    const moviesAscending = [...moviesWithRuntime].reverse();
    const topShortestMovies = moviesAscending.slice(0, 3).map(formatMovieItem);

    const longestMovie = topLongestMovies[0] || null;
    const secondLongestMovie = topLongestMovies[1] || null;
    const shortestMovie = topShortestMovies[0] || null;

    // 2. Film yang Ditonton Lebih Dari Sekali (Rewatched Movies)
    const movieRewatchMap: Record<string, { title: string; slug: string; count: number; runtimeMinutes: number; poster_url?: string | null }> = {};
    items.filter(it => it.type === 'movie').forEach(m => {
      const key = m.title || m.slug;
      if (!movieRewatchMap[key]) {
        movieRewatchMap[key] = {
          title: m.title,
          slug: m.slug,
          count: 0,
          runtimeMinutes: m.runtime_minutes || 0,
          poster_url: m.poster_url || m.thumb_url || null,
        };
      }
      movieRewatchMap[key].count++;
    });
    const rewatchedMovies = Object.values(movieRewatchMap)
      .filter(m => m.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
      .map(m => {
        const totalMins = m.runtimeMinutes * m.count;
        const totalHours = Math.floor(totalMins / 60);
        const remMins = totalMins % 60;
        return {
          ...m,
          totalDuration: `${totalHours}j ${remMins}m`,
        };
      });
    const totalRewatchCount = Object.values(movieRewatchMap).filter(m => m.count > 1).reduce((acc, m) => acc + (m.count - 1), 0);

    // 3. Series Terpanjang & Paling Banyak Ditonton
    const showMap: Record<string, { title: string; slug?: string; episodes: number; runtimeMinutes: number; poster_url?: string | null }> = {};
    items.filter(it => it.type === 'episode').forEach(ep => {
      const key = ep.show_title || ep.title;
      if (!showMap[key]) {
        showMap[key] = {
          title: key,
          slug: ep.show_slug || ep.slug,
          episodes: 0,
          runtimeMinutes: 0,
          poster_url: ep.poster_url || ep.thumb_url || null,
        };
      }
      showMap[key].episodes++;
      showMap[key].runtimeMinutes += (ep.runtime_minutes || 0);
    });

    const formatShow = (show: any) => {
      const shHours = Math.floor(show.runtimeMinutes / 60);
      const shMins = show.runtimeMinutes % 60;
      const shDays = Math.floor(shHours / 24);
      const shRemHours = shHours % 24;
      return {
        ...show,
        formattedDuration: `${shDays > 0 ? `${shDays}h ` : ''}${shRemHours}j ${shMins}m`,
      };
    };

    const allShowsList = Object.values(showMap);
    const topShowsByEpisodes = allShowsList
      .slice()
      .sort((a, b) => b.episodes - a.episodes || b.runtimeMinutes - a.runtimeMinutes)
      .slice(0, 5)
      .map(formatShow);

    const topShowsByDuration = allShowsList
      .slice()
      .sort((a, b) => b.runtimeMinutes - a.runtimeMinutes || b.episodes - a.episodes)
      .slice(0, 5)
      .map(formatShow);

    const topShows = topShowsByEpisodes;

    // 4. Hari & Jam Puncak Menonton (WIB: UTC+7)
    const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const SHORT_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dayCounts = Array(7).fill(0);
    const hourCounts = Array(24).fill(0);
    const dateStatsMap: Record<string, { date: string; count: number; minutes: number }> = {};
    const timeOfDayBuckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    let movieMinutes = 0;
    let episodeMinutes = 0;

    items.forEach(it => {
      if (it.type === 'movie') movieMinutes += (it.runtime_minutes || 0);
      else episodeMinutes += (it.runtime_minutes || 0);

      const d = new Date(it.watched_at);
      if (isNaN(d.getTime())) return;
      const wibMs = d.getTime() + 7 * 3600 * 1000;
      const wibDate = new Date(wibMs);
      const dayIdx = wibDate.getUTCDay();
      const hour = wibDate.getUTCHours();
      const dateKey = wibDate.toISOString().slice(0, 10);

      dayCounts[dayIdx]++;
      hourCounts[hour]++;

      if (hour >= 5 && hour < 12) timeOfDayBuckets.morning++;
      else if (hour >= 12 && hour < 18) timeOfDayBuckets.afternoon++;
      else if (hour >= 18 && hour <= 23) timeOfDayBuckets.evening++;
      else timeOfDayBuckets.night++;

      if (!dateStatsMap[dateKey]) {
        dateStatsMap[dateKey] = { date: dateKey, count: 0, minutes: 0 };
      }
      dateStatsMap[dateKey].count++;
      dateStatsMap[dateKey].minutes += (it.runtime_minutes || 0);
    });

    const maxDayIdx = dayCounts.indexOf(Math.max(...dayCounts));
    const busiestDay = {
      day: DAY_NAMES[maxDayIdx] || 'Minggu',
      count: dayCounts[maxDayIdx] || 0,
      percent: Math.round(((dayCounts[maxDayIdx] || 0) / (items.length || 1)) * 100),
    };

    // Ritme 7 Hari (Senin -> Minggu)
    const weeklyOrder = [1, 2, 3, 4, 5, 6, 0];
    const maxWeeklyCount = Math.max(...dayCounts, 1);
    const dayOfWeekStats = weeklyOrder.map(idx => ({
      dayIdx: idx,
      shortName: SHORT_DAYS[idx],
      fullName: DAY_NAMES[idx],
      count: dayCounts[idx],
      percent: Math.round((dayCounts[idx] / (items.length || 1)) * 100),
      relativeHeight: Math.max(16, Math.round((dayCounts[idx] / maxWeeklyCount) * 100))
    }));

    // Distribusi Waktu (4 Kuadran)
    const timeOfDayStats = {
      morning: { label: 'Pagi', timeRange: '05.00 - 11.59', count: timeOfDayBuckets.morning, percent: Math.round((timeOfDayBuckets.morning / (items.length || 1)) * 100) },
      afternoon: { label: 'Siang', timeRange: '12.00 - 17.59', count: timeOfDayBuckets.afternoon, percent: Math.round((timeOfDayBuckets.afternoon / (items.length || 1)) * 100) },
      evening: { label: 'Malam', timeRange: '18.00 - 23.59', count: timeOfDayBuckets.evening, percent: Math.round((timeOfDayBuckets.evening / (items.length || 1)) * 100) },
      night: { label: 'Begadang', timeRange: '00.00 - 04.59', count: timeOfDayBuckets.night, percent: Math.round((timeOfDayBuckets.night / (items.length || 1)) * 100) },
    };

    const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
    let persona = 'Prime Time / Malam 🌙';
    if (maxHour >= 0 && maxHour < 5) persona = 'Night Owl / Begadang 🦉';
    else if (maxHour >= 5 && maxHour < 12) persona = 'Early Bird / Pagi 🌅';
    else if (maxHour >= 12 && maxHour < 18) persona = 'Afternoon Viewer / Siang ☀️';
    else persona = 'Prime Time / Malam 🌙';

    const peakHour = {
      hour: maxHour >= 0 ? maxHour : 22,
      formatted: `${String(maxHour >= 0 ? maxHour : 22).padStart(2, '0')}.00 WIB`,
      count: hourCounts[maxHour] || 0,
      persona,
    };

    // Rasio Film vs Serial
    const watchRatio = {
      movieCount,
      episodeCount,
      movieMinutes,
      episodeMinutes,
      movieFormattedHours: `${Math.floor(movieMinutes / 60).toLocaleString()}j`,
      episodeFormattedHours: `${Math.floor(episodeMinutes / 60).toLocaleString()}j`,
      moviePercentCount: Math.round((movieCount / (items.length || 1)) * 100),
      episodePercentCount: Math.round((episodeCount / (items.length || 1)) * 100),
      moviePercentDuration: Math.round((movieMinutes / (totalMinutes || 1)) * 100),
      episodePercentDuration: Math.round((episodeMinutes / (totalMinutes || 1)) * 100),
    };

    // 5. Rekor Binge Watching (Realistis <= 24 Jam vs Arsip Impor)
    const sortedDays = Object.values(dateStatsMap).sort((a, b) => b.count - a.count);
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const formatBingeDay = (dItem: any) => {
      if (!dItem) return null;
      const [y, m, d] = dItem.date.split('-');
      const formattedDate = `${parseInt(d, 10)} ${monthNames[parseInt(m, 10) - 1]} ${y}`;
      const bHours = Math.floor(dItem.minutes / 60);
      const bMins = dItem.minutes % 60;
      return {
        date: dItem.date,
        formattedDate,
        count: dItem.count,
        formattedDuration: `${bHours}j ${bMins}m`,
      };
    };

    const realisticBinge = sortedDays.find(d => d.minutes <= 24 * 60) || sortedDays[0];
    const allTimeMaxDay = sortedDays[0];

    const recordBingeDay = {
      realBinge: formatBingeDay(realisticBinge),
      allTimeMaxDay: allTimeMaxDay && allTimeMaxDay.date !== realisticBinge?.date ? formatBingeDay(allTimeMaxDay) : null,
    };

    // 6. Jejak & Milestone Akun (First vs Latest)
    const validWatchedItems = items
      .filter(it => it.watched_at && !isNaN(new Date(it.watched_at).getTime()))
      .sort((a, b) => new Date(a.watched_at).getTime() - new Date(b.watched_at).getTime());

    const firstWatched = validWatchedItems[0] ? {
      title: validWatchedItems[0].title,
      type: validWatchedItems[0].type,
      watched_at: validWatchedItems[0].watched_at,
      poster_url: validWatchedItems[0].poster_url || validWatchedItems[0].thumb_url,
      formattedDate: new Date(validWatchedItems[0].watched_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    } : null;

    const latestWatched = validWatchedItems.length > 0 ? {
      title: validWatchedItems[validWatchedItems.length - 1].title,
      type: validWatchedItems[validWatchedItems.length - 1].type,
      watched_at: validWatchedItems[validWatchedItems.length - 1].watched_at,
      poster_url: validWatchedItems[validWatchedItems.length - 1].poster_url || validWatchedItems[validWatchedItems.length - 1].thumb_url,
      formattedDate: new Date(validWatchedItems[validWatchedItems.length - 1].watched_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    } : null;

    const timelineMilestone = {
      firstWatched,
      latestWatched,
      yearsSpan: firstWatched && latestWatched 
        ? Math.max(1, new Date(latestWatched.watched_at).getFullYear() - new Date(firstWatched.watched_at).getFullYear())
        : 0,
    };

    // 7. Ringkasan & Tren Tahunan (All-Time Year-by-Year Performance)
    const yearSummaryMap: Record<number, { year: number; count: number; movies: number; episodes: number; minutes: number }> = {};
    data.items.forEach(it => {
      const d = new Date(it.watched_at);
      if (isNaN(d.getTime())) return;
      const yr = d.getFullYear();
      if (!yearSummaryMap[yr]) {
        yearSummaryMap[yr] = { year: yr, count: 0, movies: 0, episodes: 0, minutes: 0 };
      }
      yearSummaryMap[yr].count++;
      if (it.type === 'movie') yearSummaryMap[yr].movies++;
      else yearSummaryMap[yr].episodes++;
      yearSummaryMap[yr].minutes += (it.runtime_minutes || 0);
    });

    const yearlyBreakdown = Object.values(yearSummaryMap)
      .sort((a, b) => b.year - a.year)
      .map(y => ({
        ...y,
        formattedDuration: `${Math.floor(y.minutes / 60)}j ${y.minutes % 60}m`,
        formattedHours: `${Math.floor(y.minutes / 60)}j`,
      }));

    return NextResponse.json({
      success: true,
      user: data.user,
      isNeon: data.isNeon,
      availableYears: (data as any).availableYears || [],
      availableGenres: (data as any).availableGenres || [],
      yearlyBreakdown,
      summary: {
        totalItems: items.length,
        movieCount,
        episodeCount,
        uniqueShowsCount: uniqueShows.size,
        totalMinutes,
        formattedDuration: `${days > 0 ? `${days}h ` : ''}${remainingHours}j ${remainingMinutes}m`,
        genresBreakdown: Object.entries(genresCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8),
      },
      funFacts: {
        longestMovie,
        secondLongestMovie,
        shortestMovie,
        topLongestMovies,
        topShortestMovies,
        avgMovieRuntime,
        topShows,
        topShowsByEpisodes,
        topShowsByDuration,
        rewatchedMovies,
        totalRewatchCount,
        watchRatio,
        dayOfWeekStats,
        timeOfDayStats,
        busiestDay,
        peakHour,
        recordBingeDay,
        timelineMilestone,
      },
      items,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
