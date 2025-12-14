import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Bike, TrendingUp, Mountain as MountainIcon, Clock, Loader2, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

// RouteMap component using Leaflet
function RouteMap({ 
  polyline, 
  interactive = false,
  onClick 
}: { 
  polyline: string | null;
  interactive?: boolean;
  onClick?: () => void;
}) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !polyline) return;

    // Initialize map
    const coordinates = decodePolyline(polyline);
    if (coordinates.length === 0) return;

    // Calculate bounds
    const latlngs = coordinates.map(([lat, lng]) => [lat, lng] as [number, number]);
    const bounds = L.latLngBounds(latlngs);

    // Create map with interactive settings
    const map = L.map(mapContainerRef.current, {
      zoomControl: interactive,
      attributionControl: interactive,
      dragging: interactive,
      touchZoom: interactive,
      doubleClickZoom: interactive,
      scrollWheelZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: interactive ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' : '',
    }).addTo(map);

    // Fit map to route bounds with padding
    map.fitBounds(bounds, { padding: interactive ? [20, 20] : [10, 10] });

      // Add route polyline - using orange color to stand out against green map layers
      const routePolyline = L.polyline(latlngs, {
        color: '#f97316', // orange-500
        weight: interactive ? 5 : 4,
        opacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);

      // Add start marker - using orange to match route color
      const startIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #f97316; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      const startMarker = L.marker([coordinates[0][0], coordinates[0][1]], { icon: startIcon }).addTo(map);

      // Add end marker - using darker orange to match route color
      const endIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #ea580c; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      const endMarker = L.marker(
        [coordinates[coordinates.length - 1][0], coordinates[coordinates.length - 1][1]],
        { icon: endIcon }
      ).addTo(map);

    mapRef.current = map;
    polylineRef.current = routePolyline;
    startMarkerRef.current = startMarker;
    endMarkerRef.current = endMarker;

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        polylineRef.current = null;
        startMarkerRef.current = null;
        endMarkerRef.current = null;
      }
    };
  }, [polyline, interactive]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full" 
      onClick={!interactive && onClick ? onClick : undefined}
      style={{ 
        minHeight: interactive ? '600px' : '128px',
        cursor: !interactive && onClick ? 'pointer' : 'default',
        position: 'relative',
        zIndex: 1,
        isolation: 'isolate' // Create a new stacking context
      }}
    />
  );
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
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  useEffect(() => {
    fetchStravaData();
  }, []);

  // Add/remove body class when modal is open and handle escape key
  useEffect(() => {
    if (isMapModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'relative';
      
      // Handle escape key to close modal
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsMapModalOpen(false);
        }
      };
      
      window.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        window.removeEventListener('keydown', handleEscape);
      };
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
    }
  }, [isMapModalOpen]);

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
      <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 h-32 relative bike-widget-map-container" style={{ zIndex: 1, isolation: 'isolate' }}>
        {activity.route_polyline ? (
          <RouteMap 
            polyline={activity.route_polyline} 
            onClick={() => setIsMapModalOpen(true)}
          />
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

      {/* Map Lightbox Modal - Rendered via Portal */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isMapModalOpen && activity.route_polyline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMapModalOpen(false)}
              style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99999,
                margin: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem'
              }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
                style={{ 
                  zIndex: 100000,
                  position: 'relative'
                }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsMapModalOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors shadow-lg"
                  aria-label="Close map"
                  style={{ 
                    zIndex: 100001,
                    position: 'absolute'
                  }}
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Interactive Map */}
                <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
                  <RouteMap polyline={activity.route_polyline} interactive={true} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}