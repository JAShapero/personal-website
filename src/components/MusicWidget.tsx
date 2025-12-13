import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Music, Loader2 } from 'lucide-react';

interface MusicWidgetProps {
  isActive: boolean;
  onClick: () => void;
}

interface Track {
  title: string;
  artist: string;
  plays?: number;
  playedAt?: string;
}

// Spotify API Configuration
// To use this widget with real Spotify data:
// 1. Go to https://developer.spotify.com/dashboard
// 2. Create a new app and get your Client ID and Client Secret
// 3. Set up OAuth 2.0 with the following scopes: user-read-recently-played, user-top-read
// 4. Replace YOUR_ACCESS_TOKEN_HERE with your actual access token
const SPOTIFY_ACCESS_TOKEN = 'YOUR_ACCESS_TOKEN_HERE';

export function MusicWidget({ isActive, onClick }: MusicWidgetProps) {
  const [view, setView] = useState<'recent' | 'lifetime'>('recent');
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSpotifyData();
  }, []);

  const fetchSpotifyData = async () => {
    setLoading(true);
    setError(null);

    try {
      // In production, replace this with actual Spotify API calls
      if (SPOTIFY_ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
        // Use mock data when no token is configured
        setTimeout(() => {
          setRecentTracks(mockRecentTracks);
          setTopTracks(mockTopTracks);
          setLoading(false);
        }, 500);
        return;
      }

      // Fetch recently played tracks
      const recentResponse = await fetch(
        'https://api.spotify.com/v1/me/player/recently-played?limit=15',
        {
          headers: {
            Authorization: `Bearer ${SPOTIFY_ACCESS_TOKEN}`,
          },
        }
      );

      if (!recentResponse.ok) {
        throw new Error('Failed to fetch recent tracks');
      }

      const recentData = await recentResponse.json();
      const formattedRecent = recentData.items.map((item: any) => ({
        title: item.track.name,
        artist: item.track.artists.map((a: any) => a.name).join(', '),
        playedAt: item.played_at,
      }));

      // Fetch top tracks (all time - using long_term time range)
      const topResponse = await fetch(
        'https://api.spotify.com/v1/me/top/tracks?limit=15&time_range=long_term',
        {
          headers: {
            Authorization: `Bearer ${SPOTIFY_ACCESS_TOKEN}`,
          },
        }
      );

      if (!topResponse.ok) {
        throw new Error('Failed to fetch top tracks');
      }

      const topData = await topResponse.json();
      const formattedTop = topData.items.map((track: any, index: number) => ({
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        plays: topData.items.length - index, // Approximate play count based on ranking
      }));

      setRecentTracks(formattedRecent);
      setTopTracks(formattedTop);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching Spotify data:', err);
      setError('Failed to load music data');
      // Fallback to mock data on error
      setRecentTracks(mockRecentTracks);
      setTopTracks(mockTopTracks);
      setLoading(false);
    }
  };

  const handleToggle = (e: React.MouseEvent, newView: 'recent' | 'lifetime') => {
    e.stopPropagation();
    setView(newView);
  };

  const tracks = view === 'recent' ? recentTracks : topTracks;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer transition-all border ${
        isActive
          ? 'border-purple-500 shadow-md'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
          <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-gray-900 dark:text-gray-100 flex-1">Music</h3>
      </div>

      {/* Toggle */}
      <div className="flex gap-1 mb-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <button
          onClick={(e) => handleToggle(e, 'recent')}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs transition-all ${
            view === 'recent'
              ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Recently Played
        </button>
        <button
          onClick={(e) => handleToggle(e, 'lifetime')}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs transition-all ${
            view === 'lifetime'
              ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          All Time
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-4 text-sm text-red-500 dark:text-red-400">
          {error}
        </div>
      ) : (
        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 music-scrollbar">
          {tracks.map((track, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                  {track.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {track.artist}
                </p>
              </div>
              {view === 'lifetime' && track.plays && (
                <span className="text-xs text-purple-600 dark:text-purple-400 flex-shrink-0">
                  #{index + 1}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Mock data for development/fallback
const mockRecentTracks: Track[] = [
  { title: 'Midnight City', artist: 'M83' },
  { title: 'Strobe', artist: 'Deadmau5' },
  { title: 'Breathe', artist: 'Télépopmusik' },
  { title: 'Lost in the World', artist: 'Kanye West' },
  { title: 'Holocene', artist: 'Bon Iver' },
  { title: 'Everything in Its Right Place', artist: 'Radiohead' },
  { title: 'Hannah Hunt', artist: 'Vampire Weekend' },
  { title: 'Retrograde', artist: 'James Blake' },
  { title: 'Digital Love', artist: 'Daft Punk' },
  { title: 'Sleep Sound', artist: 'Jamie xx' },
  { title: 'High and Dry', artist: 'Radiohead' },
  { title: 'Touch', artist: 'Daft Punk' },
  { title: 'New Lands', artist: 'Justice' },
  { title: 'Crystalised', artist: 'The xx' },
  { title: 'Nude', artist: 'Radiohead' },
];

const mockTopTracks: Track[] = [
  { title: 'Strobe', artist: 'Deadmau5', plays: 15 },
  { title: 'Intro', artist: 'The xx', plays: 14 },
  { title: 'Teardrop', artist: 'Massive Attack', plays: 13 },
  { title: 'Midnight City', artist: 'M83', plays: 12 },
  { title: 'Pyramids', artist: 'Frank Ocean', plays: 11 },
  { title: 'Holocene', artist: 'Bon Iver', plays: 10 },
  { title: 'Skinny Love', artist: 'Bon Iver', plays: 9 },
  { title: 'Breathe', artist: 'Télépopmusik', plays: 8 },
  { title: 'Karma Police', artist: 'Radiohead', plays: 7 },
  { title: 'Everything in Its Right Place', artist: 'Radiohead', plays: 6 },
  { title: 'Hannah Hunt', artist: 'Vampire Weekend', plays: 5 },
  { title: 'Digital Love', artist: 'Daft Punk', plays: 4 },
  { title: 'Retrograde', artist: 'James Blake', plays: 3 },
  { title: 'Touch', artist: 'Daft Punk', plays: 2 },
  { title: 'Time', artist: 'Hans Zimmer', plays: 1 },
];
