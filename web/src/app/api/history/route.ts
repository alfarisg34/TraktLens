// src/app/api/history/route.ts
import { NextResponse } from 'next/server';
import { getWatchHistory } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const type = searchParams.get('type') || undefined;

    const data = await getWatchHistory({ startDate, endDate, type });

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

    return NextResponse.json({
      success: true,
      user: data.user,
      isNeon: data.isNeon,
      availableYears: (data as any).availableYears || [],
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
      items,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
