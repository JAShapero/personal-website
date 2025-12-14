import type { VercelRequest, VercelResponse } from '@vercel/node';

interface SpotifyTrack {
  name: string;
  artists: Array<{ name: string }>;
  album?: {
    images: Array<{ url: string }>;
  };
}

interface RecentlyPlayedItem {
  track: SpotifyTrack;
  played_at: string;
}

interface TopTracksResponse {
  items: SpotifyTrack[];
}

interface RecentlyPlayedResponse {
  items: RecentlyPlayedItem[];
}

// Get Spotify access token from environment variable
function getSpotifyToken(): string | null {
  return process.env.SPOTIFY_ACCESS_TOKEN || null;
}

// Refresh Spotify access token using client credentials
async function refreshSpotifyToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    return null;
  }

  try {
    // If we have a refresh token, use it to get a new access token
    if (refreshToken) {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.access_token;
      }
    }
  } catch (error) {
    console.error('Error refreshing Spotify token:', error);
  }

  return null;
}

// Get a valid Spotify access token
async function getValidToken(): Promise<string | null> {
  let token = getSpotifyToken();
  
  // If no token or token might be expired, try to refresh
  if (!token) {
    token = await refreshSpotifyToken();
  }
  
  return token;
}

// Fetch recently played tracks from Spotify
async function fetchRecentlyPlayed(accessToken: string, limit: number = 15): Promise<RecentlyPlayedResponse> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Fetch top tracks from Spotify
async function fetchTopTracks(accessToken: string, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'long_term', limit: number = 15): Promise<TopTracksResponse> {
  const response = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type = 'recent', limit = '15', time_range = 'long_term' } = req.query;

    const accessToken = await getValidToken();

    if (!accessToken) {
      return res.status(401).json({
        error: 'Spotify not configured',
        message: 'SPOTIFY_ACCESS_TOKEN or SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET not set in environment variables.',
      });
    }

    let data;

    if (type === 'recent') {
      const recentData = await fetchRecentlyPlayed(accessToken, parseInt(limit as string));
      
      // Remove duplicates based on track title and artist
      const seen = new Set<string>();
      const uniqueTracks = recentData.items.filter((item) => {
        const trackKey = `${item.track.name.toLowerCase()}|${item.track.artists.map((a) => a.name.toLowerCase()).join(',')}`;
        if (seen.has(trackKey)) {
          return false;
        }
        seen.add(trackKey);
        return true;
      });
      
      data = {
        tracks: uniqueTracks.map((item) => ({
          title: item.track.name,
          artist: item.track.artists.map((a) => a.name).join(', '),
          playedAt: item.played_at,
          albumArt: item.track.album?.images?.[0]?.url,
        })),
      };
    } else if (type === 'top') {
      const topData = await fetchTopTracks(
        accessToken,
        time_range as 'short_term' | 'medium_term' | 'long_term',
        parseInt(limit as string)
      );
      console.log('Spotify Top Tracks API Response:', JSON.stringify(topData, null, 2));
      data = {
        tracks: topData.items.map((track, index) => ({
          title: track.name,
          artist: track.artists.map((a) => a.name).join(', '),
          rank: index + 1,
          albumArt: track.album?.images?.[0]?.url,
        })),
      };
    } else {
      return res.status(400).json({ error: 'Invalid type. Use "recent" or "top"' });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Spotify API error:', error);

    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Spotify access token is invalid or expired. Please refresh your token.',
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An error occurred while fetching Spotify data.',
    });
  }
}

