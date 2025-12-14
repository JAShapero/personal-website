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
  location_city?: string | null;
  location_state?: string | null;
  location_country?: string | null;
}

const mockStravaData: StravaActivity = {
  distance: 42150, // 42.15 km = 26.2 miles
  elevation_gain: 523, // meters = 1716 feet
  moving_time: 7245, // 2 hours 45 seconds
  name: "Morning Highline Canal Ride",
  route_polyline: null, // In real app, decode this to draw route
  start_date_local: new Date().toISOString(),
  location_city: "Boulder",
  location_state: "CO"
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

// Decode Google polyline format to coordinates
function decodePolyline(encoded: string): Array<[number, number]> {
  const coordinates: Array<[number, number]> = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
    lng += deltaLng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}

// Convert lat/lng coordinates to SVG path
function coordinatesToPath(coordinates: Array<[number, number]>, width: number, height: number): string {
  if (coordinates.length === 0) return '';

  // Find bounds
  let minLat = coordinates[0][0];
  let maxLat = coordinates[0][0];
  let minLng = coordinates[0][1];
  let maxLng = coordinates[0][1];

  coordinates.forEach(([lat, lng]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  });

  // Add padding
  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;
  const padding = 0.1;
  const paddedLatRange = latRange * (1 + padding * 2);
  const paddedLngRange = lngRange * (1 + padding * 2);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  minLat = centerLat - paddedLatRange / 2;
  maxLat = centerLat + paddedLatRange / 2;
  minLng = centerLng - paddedLngRange / 2;
  maxLng = centerLng + paddedLngRange / 2;

  // Convert to SVG coordinates
  const scaleX = width / (maxLng - minLng);
  const scaleY = height / (maxLat - minLat);
  const scale = Math.min(scaleX, scaleY);

  const path = coordinates
    .map(([lat, lng], index) => {
      const x = ((lng - minLng) * scale) + (width - (maxLng - minLng) * scale) / 2;
      const y = height - ((lat - minLat) * scale) - (height - (maxLat - minLat) * scale) / 2;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return path;
}

function formatActivityDisplay(activity: StravaActivity): string {
  // Format date as MM/DD/YY
  let dateStr = '';
  if (activity.start_date_local) {
    const date = new Date(activity.start_date_local);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    dateStr = `${month}/${day}/${year}`;
  }

  // Format location as City, State
  const locationParts: string[] = [];
  if (activity.location_city) {
    locationParts.push(activity.location_city);
  }
  if (activity.location_state) {
    locationParts.push(activity.location_state);
  }
  const locationStr = locationParts.length > 0 ? locationParts.join(', ') : '';

  // Combine date and location
  if (dateStr && locationStr) {
    return `${dateStr} - ${locationStr}`;
  } else if (dateStr) {
    return dateStr;
  } else if (locationStr) {
    return locationStr;
  } else {
    // Fallback to activity name if no date/location
    return activity.name;
  }
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
          <p className="text-xs text-gray-500 dark:text-gray-400">{formatActivityDisplay(activity)}</p>
        </div>
      </div>

      {/* Route Map */}
      <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 h-32 relative">
        {activity.route_polyline ? (
          (() => {
            try {
              const coordinates = decodePolyline(activity.route_polyline);
              const path = coordinatesToPath(coordinates, 300, 128);
              const startPoint = coordinates[0];
              const endPoint = coordinates[coordinates.length - 1];
              
              // Calculate SVG coordinates for markers
              let minLat = coordinates[0][0];
              let maxLat = coordinates[0][0];
              let minLng = coordinates[0][1];
              let maxLng = coordinates[0][1];
              coordinates.forEach(([lat, lng]) => {
                minLat = Math.min(minLat, lat);
                maxLat = Math.max(maxLat, lat);
                minLng = Math.min(minLng, lng);
                maxLng = Math.max(maxLng, lng);
              });
              const latRange = maxLat - minLat || 0.01;
              const lngRange = maxLng - minLng || 0.01;
              const padding = 0.1;
              const paddedLatRange = latRange * (1 + padding * 2);
              const paddedLngRange = lngRange * (1 + padding * 2);
              const centerLat = (minLat + maxLat) / 2;
              const centerLng = (minLng + maxLng) / 2;
              minLat = centerLat - paddedLatRange / 2;
              maxLat = centerLat + paddedLatRange / 2;
              minLng = centerLng - paddedLngRange / 2;
              maxLng = centerLng + paddedLngRange / 2;
              const width = 300;
              const height = 128;
              const scaleX = width / (maxLng - minLng);
              const scaleY = height / (maxLat - minLat);
              const scale = Math.min(scaleX, scaleY);
              
              const startX = ((startPoint[1] - minLng) * scale) + (width - (maxLng - minLng) * scale) / 2;
              const startY = height - ((startPoint[0] - minLat) * scale) - (height - (maxLat - minLat) * scale) / 2;
              const endX = ((endPoint[1] - minLng) * scale) + (width - (maxLng - minLng) * scale) / 2;
              const endY = height - ((endPoint[0] - minLat) * scale) - (height - (maxLat - minLat) * scale) / 2;

              return (
                <svg className="w-full h-full" viewBox="0 0 300 128" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
                      <stop offset="100%" style={{ stopColor: '#059669', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  {/* Route path */}
                  <path
                    d={path}
                    stroke="url(#routeGradient)"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Start marker */}
                  <circle cx={startX} cy={startY} r="4" fill="#10b981" stroke="white" strokeWidth="1.5" />
                  {/* End marker */}
                  <circle cx={endX} cy={endY} r="4" fill="#059669" stroke="white" strokeWidth="1.5" />
                </svg>
              );
            } catch (error) {
              console.error('Error rendering map:', error);
              return (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                  Map unavailable
                </div>
              );
            }
          })()
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
            No route data available
          </div>
        )}
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