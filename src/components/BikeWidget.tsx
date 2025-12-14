import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bike, TrendingUp, Mountain as MountainIcon, Clock, Loader2 } from 'lucide-react';

interface BikeWidgetProps {
  isActive: boolean;
  onClick: () => void;
}

interface StravaActivity {
  distance: number; // in meters
  elevation_gain: number; // in meters
  moving_time: number; // in seconds
  elapsed_time?: number; // in seconds
  name: string;
  route_polyline: string | null; // encoded polyline
  start_date?: string;
  start_date_local?: string;
}

const mockStravaData: StravaActivity = {
  distance: 42150, // 42.15 km = 26.2 miles
  elevation_gain: 523, // meters = 1716 feet
  moving_time: 7245, // 2 hours 45 seconds
  name: "Morning Highline Canal Ride",
  route_polyline: null // In real app, decode this to draw route
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDistance(meters: number): string {
  const miles = meters * 0.000621371;
  return `${miles.toFixed(1)} mi`;
}

function formatElevation(meters: number): string {
  const feet = meters * 3.28084;
  return `${Math.round(feet)} ft`;
}

export function BikeWidget({ isActive, onClick }: BikeWidgetProps) {
  const [activity, setActivity] = useState<StravaActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  useEffect(() => {
    fetchStravaData();
  }, []);

  const fetchStravaData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/strava?type=latest&per_page=10');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // If Strava is not configured, use mock data
        if (response.status === 401 || response.status === 500 || response.status === 404) {
          setActivity(mockStravaData);
          setIsUsingMockData(true);
          setLoading(false);
          return;
        }
        throw new Error(errorData.message || 'Failed to fetch ride data');
      }

      const data = await response.json();
      setActivity(data.activity);
      setIsUsingMockData(false);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching Strava data:', err);
      setError('Failed to load ride data');
      // Fallback to mock data on error
      setActivity(mockStravaData);
      setIsUsingMockData(true);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer transition-all border flex flex-col h-full ${
          isActive 
            ? 'border-green-500 shadow-md' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <Bike className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-gray-900 dark:text-gray-100">Last Ride</h3>
        </div>
        <div className="flex items-center justify-center h-[200px]">
          <Loader2 className="w-6 h-6 text-green-600 dark:text-green-400 animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (!activity) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer transition-all border flex flex-col h-full ${
          isActive 
            ? 'border-green-500 shadow-md' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <Bike className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-gray-900 dark:text-gray-100">Last Ride</h3>
        </div>
        <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
          {error || 'No ride data available'}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer transition-all border flex flex-col h-full ${
        isActive 
          ? 'border-green-500 shadow-md' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg">
          <Bike className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-gray-900 dark:text-gray-100">Last Ride</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{activity.name}</p>
        </div>
      </div>

      {/* Map placeholder - Replace with actual route map */}
      <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 h-32 relative">
        {/* TODO: Use Mapbox, Google Maps, or Leaflet to render the actual route */}
        {/* Decode the polyline and display on map */}
        <svg className="w-full h-full" viewBox="0 0 300 128">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          {/* Mock route path - replace with actual decoded polyline */}
          <path
            d="M 10 100 Q 50 40, 100 60 T 200 50 T 290 80"
            stroke="url(#routeGradient)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {/* Start marker */}
          <circle cx="10" cy="100" r="4" fill="#10b981" />
          {/* End marker */}
          <circle cx="290" cy="80" r="4" fill="#059669" />
        </svg>
        <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded px-2 py-1 text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
          Route Map
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 flex-1">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Distance</span>
          </div>
          <p className="text-gray-900 dark:text-gray-100">{formatDistance(activity.distance)}</p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-1 mb-1">
            <MountainIcon className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Elevation</span>
          </div>
          <p className="text-gray-900 dark:text-gray-100">{formatElevation(activity.elevation_gain)}</p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Duration</span>
          </div>
          <p className="text-gray-900 dark:text-gray-100">{formatDuration(activity.moving_time)}</p>
        </div>
      </div>

      {/* API Integration Note - only show if using mock data */}
      {isUsingMockData && (
        <div className="mt-auto text-xs text-gray-500 dark:text-gray-400 text-center">
          Connect to Strava API for live data
        </div>
      )}
    </motion.div>
  );
}