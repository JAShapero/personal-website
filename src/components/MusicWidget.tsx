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
  rank?: number;
  albumArt?: string;
}

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
      // Fetch recently played tracks from our API endpoint
      // Request more tracks to account for duplicates, then we'll limit to 10 unique
      const recentResponse = await fetch('/api/spotify?type=recent&limit=50');
      
      if (!recentResponse.ok) {
        const errorData = await recentResponse.json().catch(() => ({}));
        // If Spotify is not configured, use mock data
        if (recentResponse.status === 401 || recentResponse.status === 500) {
          setRecentTracks(mockRecentTracks);
          setTopTracks(mockTopTracks);
          setLoading(false);
          return;
        }
        throw new Error(errorData.message || 'Failed to fetch recent tracks');
      }

      const recentData = await recentResponse.json();
      // Limit to 10 unique tracks after duplicates are removed
      setRecentTracks((recentData.tracks || []).slice(0, 10));

      // Fetch top artists (all time - using long_term time range)
      // Note: Spotify's long_term is calculated from several years, not true all-time
      const topArtistsResponse = await fetch('/api/spotify?type=artists&limit=50&time_range=long_term');
      
      if (!topArtistsResponse.ok) {
        const errorData = await topArtistsResponse.json().catch(() => ({}));
        // If we got recent tracks but top artists failed, just use empty array
        if (topArtistsResponse.status === 401 || topArtistsResponse.status === 500) {
          setTopTracks(mockTopTracks);
          setLoading(false);
          return;
        }
        throw new Error(errorData.message || 'Failed to fetch top artists');
      }

      const topArtistsData = await topArtistsResponse.json();
      console.log('Spotify Top Artists Response:', topArtistsData);
      setTopTracks(topArtistsData.tracks || []);
      setLoading(false);
    } catch (err: any) {
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
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer transition-all border flex flex-col h-full ${
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
          Top Artists P365
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
        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {tracks.map((track, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                  {track.title}
                </p>
                {view === 'recent' && track.artist && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {track.artist}
                  </p>
                )}
              </div>
              {view === 'lifetime' && (track.rank || track.plays) && (
                <span className="text-xs text-purple-600 dark:text-purple-400 flex-shrink-0">
                  #{track.rank || index + 1}
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
