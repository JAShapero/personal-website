import type { VercelRequest, VercelResponse } from '@vercel/node';

interface StravaActivity {
  id: number;
  name: string;
  distance: number; // in meters
  moving_time: number; // in seconds
  elapsed_time: number; // in seconds
  total_elevation_gain: number; // in meters
  start_date: string;
  start_date_local: string;
  location_city?: string | null;
  location_state?: string | null;
  location_country?: string | null;
  map?: {
    summary_polyline?: string;
    polyline?: string;
  };
  type: string;
}

// Get Strava access token from environment variable
function getStravaToken(): string | null {
  return process.env.STRAVA_ACCESS_TOKEN || null;
}

// Refresh Strava access token using refresh token
async function refreshStravaToken(): Promise<string | null> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.access_token;
    }
  } catch (error) {
    console.error('Error refreshing Strava token:', error);
  }

  return null;
}

// Get a valid Strava access token
async function getValidToken(): Promise<string | null> {
  let token = getStravaToken();
  
  // If no token or token might be expired, try to refresh
  if (!token) {
    token = await refreshStravaToken();
  }
  
  return token;
}

// Fetch activities from Strava
async function fetchActivities(accessToken: string, perPage: number = 1): Promise<StravaActivity[]> {
  const response = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`,
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
    throw new Error(`Strava API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Fetch a specific activity with detailed information including map
async function fetchActivity(accessToken: string, activityId: number): Promise<StravaActivity> {
  const response = await fetch(
    `https://www.strava.com/api/v3/activities/${activityId}`,
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
    throw new Error(`Strava API error: ${response.status} ${response.statusText}`);
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
    const { type = 'latest', per_page = '1' } = req.query;

    const accessToken = await getValidToken();

    if (!accessToken) {
      return res.status(401).json({
        error: 'Strava not configured',
        message: 'STRAVA_ACCESS_TOKEN or STRAVA_CLIENT_ID/STRAVA_CLIENT_SECRET/STRAVA_REFRESH_TOKEN not set in environment variables.',
      });
    }

    let data;

    if (type === 'latest') {
      // Fetch the latest activity
      const activities = await fetchActivities(accessToken, parseInt(per_page as string));
      
      if (activities.length === 0) {
        return res.status(404).json({
          error: 'No activities found',
          message: 'No bike activities found in your Strava account.',
        });
      }

      // Filter for bike activities (type === 'Ride')
      const bikeActivities = activities.filter(activity => activity.type === 'Ride');
      
      if (bikeActivities.length === 0) {
        return res.status(404).json({
          error: 'No bike activities found',
          message: 'No bike rides found in your recent Strava activities.',
        });
      }

      // Get the most recent bike activity
      const latestActivity = bikeActivities[0];
      
      // Fetch detailed activity info including map polyline
      const detailedActivity = await fetchActivity(accessToken, latestActivity.id);

      data = {
        activity: {
          name: detailedActivity.name,
          distance: detailedActivity.distance,
          elevation_gain: detailedActivity.total_elevation_gain,
          moving_time: detailedActivity.moving_time,
          elapsed_time: detailedActivity.elapsed_time,
          start_date: detailedActivity.start_date,
          start_date_local: detailedActivity.start_date_local,
          location_city: detailedActivity.location_city,
          location_state: detailedActivity.location_state,
          location_country: detailedActivity.location_country,
          route_polyline: detailedActivity.map?.summary_polyline || detailedActivity.map?.polyline || null,
        },
      };
    } else {
      return res.status(400).json({ error: 'Invalid type. Use "latest"' });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Strava API error:', error);

    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Strava access token is invalid or expired. Please refresh your token.',
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An error occurred while fetching Strava data.',
    });
  }
}

