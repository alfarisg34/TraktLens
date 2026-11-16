// src/app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { saveSyncData, getWatchHistory, WatchItem, UserProfile } from '@/lib/db';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET() {
  try {
    const data = await getWatchHistory({ sort: 'latest' });
    const latestItem = data.items[0];
    return NextResponse.json({
      success: true,
      totalCount: data.items.length,
      latestWatchedAt: latestItem?.watched_at || null,
      latestTitle: latestItem?.title || null,
      isNeon: data.isNeon,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user, items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Format data items tidak valid' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const userProfile: UserProfile = {
      id: user?.userId || 'trakt-user',
      username: user?.username || 'alfarisg34',
      avatar_url: user?.avatarUrl || null,
      updated_at: new Date().toISOString(),
    };

    const parsedItems: WatchItem[] = items.map((raw: any) => {
      const isMovie = raw.type === 'movie';
      const movie = raw.movie;
      const episode = raw.episode;
      const show = raw.show;

      const formatImg = (path?: string) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `https://${path}`;
      };

      const getValidDate = (val?: string) => {
        if (val && !isNaN(new Date(val).getTime())) {
          return new Date(val).toISOString();
        }
        return new Date().toISOString();
      };

      const watchedAt = getValidDate(raw.watched_at || raw.last_watched_at || raw.created_at || raw.updated_at);

      if (isMovie && movie) {
        return {
          id: raw.id,
          user_id: userProfile.id,
          type: 'movie',
          watched_at: watchedAt,
          action: raw.action || 'watch',
          title: movie.title || 'Untitled Movie',
          slug: movie.ids?.slug || '',
          trakt_id: movie.ids?.trakt,
          imdb_id: movie.ids?.imdb,
          tmdb_id: movie.ids?.tmdb,
          runtime_minutes: movie.runtime || 0,
          poster_url: formatImg(movie.images?.poster?.[0] || movie.images?.fanart?.[0]),
          thumb_url: formatImg(movie.images?.fanart?.[0] || movie.images?.thumb?.[0]),
          genres: movie.genres || [],
        };
      } else if (episode && show) {
        return {
          id: raw.id,
          user_id: userProfile.id,
          type: 'episode',
          watched_at: watchedAt,
          action: raw.action || 'watch',
          title: show.title || 'Untitled Show',
          slug: show.ids?.slug || '',
          trakt_id: episode.ids?.trakt,
          imdb_id: episode.ids?.imdb,
          tmdb_id: episode.ids?.tmdb,
          show_title: show.title,
          show_slug: show.ids?.slug,
          season_number: episode.season,
          episode_number: episode.number,
          episode_title: episode.title,
          runtime_minutes: episode.runtime || show.runtime || 0,
          poster_url: formatImg(show.images?.poster?.[0]),
          thumb_url: formatImg(episode.images?.screenshot?.[0] || show.images?.fanart?.[0]),
          genres: show.genres || [],
        };
      }

      // Fallback
      return {
        id: raw.id,
        user_id: userProfile.id,
        type: raw.type || 'movie',
        watched_at: watchedAt,
        action: raw.action || 'watch',
        title: raw.title || 'Item',
        slug: '',
        runtime_minutes: 0,
      };
    });

    const result = await saveSyncData(userProfile, parsedItems);

    return NextResponse.json(
      {
        success: true,
        savedCount: parsedItems.length,
        mode: result.mode,
        total: (result as any).total,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
