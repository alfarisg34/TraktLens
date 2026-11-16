// src/app/api/history/route.ts
import { NextResponse } from 'next/server';
import { getWatchHistory } from '@/lib/db';

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
    // 1. Film Terpanjang & Terpendek
    const moviesWithRuntime = items.filter(it => it.type === 'movie' && (it.runtime_minutes || 0) > 0);
    moviesWithRuntime.sort((a, b) => (b.runtime_minutes || 0) - (a.runtime_minutes || 0));

    const longestMovie = moviesWithRuntime[0] ? {
      title: moviesWithRuntime[0].title,
      slug: moviesWithRuntime[0].slug,
      runtimeMinutes: moviesWithRuntime[0].runtime_minutes,
      formattedDuration: `${Math.floor(moviesWithRuntime[0].runtime_minutes / 60)}j ${moviesWithRuntime[0].runtime_minutes % 60}m`,
      poster_url: moviesWithRuntime[0].poster_url || moviesWithRuntime[0].thumb_url || null,
      genres: moviesWithRuntime[0].genres || [],
    } : null;

    const shortestMovie = moviesWithRuntime.length > 0 ? {
      title: moviesWithRuntime[moviesWithRuntime.length - 1].title,
      slug: moviesWithRuntime[moviesWithRuntime.length - 1].slug,
      runtimeMinutes: moviesWithRuntime[moviesWithRuntime.length - 1].runtime_minutes,
      formattedDuration: `${Math.floor(moviesWithRuntime[moviesWithRuntime.length - 1].runtime_minutes / 60)}j ${moviesWithRuntime[moviesWithRuntime.length - 1].runtime_minutes % 60}m`,
      poster_url: moviesWithRuntime[moviesWithRuntime.length - 1].poster_url || moviesWithRuntime[moviesWithRuntime.length - 1].thumb_url || null,
      genres: moviesWithRuntime[moviesWithRuntime.length - 1].genres || [],
    } : null;

    // 2. Film yang Ditonton Lebih Dari Sekali (Rewatched Movies)
    const movieRewatchMap: Record<string, { title: string; slug: string; count: number; poster_url?: string | null }> = {};
    items.filter(it => it.type === 'movie').forEach(m => {
      const key = m.title || m.slug;
      if (!movieRewatchMap[key]) {
        movieRewatchMap[key] = {
          title: m.title,
          slug: m.slug,
          count: 0,
          poster_url: m.poster_url || m.thumb_url || null,
        };
      }
      movieRewatchMap[key].count++;
    });
    const rewatchedMovies = Object.values(movieRewatchMap)
      .filter(m => m.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

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

    const topShows = Object.values(showMap)
      .sort((a, b) => b.episodes - a.episodes)
      .slice(0, 4)
      .map(show => {
        const shHours = Math.floor(show.runtimeMinutes / 60);
        const shMins = show.runtimeMinutes % 60;
        const shDays = Math.floor(shHours / 24);
        const shRemHours = shHours % 24;
        return {
          ...show,
          formattedDuration: `${shDays > 0 ? `${shDays}h ` : ''}${shRemHours}j ${shMins}m`,
        };
      });

    // 4. Hari & Jam Puncak Menonton (WIB: UTC+7)
    const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayCounts = Array(7).fill(0);
    const hourCounts = Array(24).fill(0);
    const dateStatsMap: Record<string, { date: string; count: number; minutes: number }> = {};

    items.forEach(it => {
      const d = new Date(it.watched_at);
      if (isNaN(d.getTime())) return;
      const wibMs = d.getTime() + 7 * 3600 * 1000;
      const wibDate = new Date(wibMs);
      const dayIdx = wibDate.getUTCDay();
      const hour = wibDate.getUTCHours();
      const dateKey = wibDate.toISOString().slice(0, 10);

      dayCounts[dayIdx]++;
      hourCounts[hour]++;

      if (!dateStatsMap[dateKey]) {
        dateStatsMap[dateKey] = { date: dateKey, count: 0, minutes: 0 };
      }
      dateStatsMap[dateKey].count++;
      dateStatsMap[dateKey].minutes += (it.runtime_minutes || 0);
    });

    const maxDayIdx = dayCounts.indexOf(Math.max(...dayCounts));
    const busiestDay = {
      day: DAY_NAMES[maxDayIdx] || 'Sabtu',
      count: dayCounts[maxDayIdx] || 0,
    };

    const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
    let persona = 'Prime Time Viewer 🌙';
    if (maxHour >= 0 && maxHour < 5) persona = 'Night Owl / Begadang 🦉';
    else if (maxHour >= 5 && maxHour < 12) persona = 'Early Bird / Pagi 🌅';
    else if (maxHour >= 12 && maxHour < 18) persona = 'Afternoon Viewer / Siang ☀️';
    else persona = 'Prime Time / Malam 🌙';

    const peakHour = {
      hour: maxHour >= 0 ? maxHour : 20,
      formatted: `${String(maxHour >= 0 ? maxHour : 20).padStart(2, '0')}.00 WIB`,
      count: hourCounts[maxHour] || 0,
      persona,
    };

    // 5. Rekor Binge Watching (Hari dengan Tontonan Terbanyak)
    const sortedDays = Object.values(dateStatsMap).sort((a, b) => b.count - a.count);
    const topBinge = sortedDays[0];
    let recordBingeDay = null;
    if (topBinge && topBinge.count > 0) {
      const [y, m, d] = topBinge.date.split('-');
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const formattedDate = `${parseInt(d, 10)} ${monthNames[parseInt(m, 10) - 1]} ${y}`;
      const bHours = Math.floor(topBinge.minutes / 60);
      const bMins = topBinge.minutes % 60;
      recordBingeDay = {
        date: topBinge.date,
        formattedDate,
        count: topBinge.count,
        formattedDuration: `${bHours}j ${bMins}m`,
      };
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      isNeon: data.isNeon,
      availableYears: (data as any).availableYears || [],
      availableGenres: (data as any).availableGenres || [],
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
        shortestMovie,
        topShows,
        rewatchedMovies,
        busiestDay,
        peakHour,
        recordBingeDay,
      },
      items,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
