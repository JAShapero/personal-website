import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { retryWithBackoff } from './retry';

// Read data files
function readDataFile(filename: string): string {
  try {
    const filePath = join(process.cwd(), 'src', 'data', filename);
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return '';
  }
}

const aboutMeContent = readDataFile('about-me.md');
const photosContent = readDataFile('photos.md');
const snowboardingCsvContent = readDataFile('snowboarding.csv');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

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
async function getValidStravaToken(): Promise<string | null> {
  let token: string | null = process.env.STRAVA_ACCESS_TOKEN || null;
  
  // If no token or token might be expired, try to refresh
  if (!token) {
    token = await refreshStravaToken();
  }
  
  return token;
}

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  activeWidget: string | null;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

// Parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim()); // Push last field
  return result;
}

// Parse snowboarding CSV data - returns both structured data and entries list
function parseSnowboardingData() {
  const lines = snowboardingCsvContent.trim().split('\n');
  const data: Record<string, { [key: string]: number | string }> = {};
  const entries: Array<{ date: string; location: string; season: string; days: number }> = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const [date, location, season, daysStr] = parseCSVLine(lines[i]);
    
    // Normalize season format: "24-'25" -> "2024-25", "25-'26" -> "2025-26"
    let normalizedSeason = season;
    if (season.includes("'")) {
      const match = season.match(/(\d+)-'(\d+)/);
      if (match) {
        const start = parseInt(match[1]);
        const end = parseInt(match[2]);
        normalizedSeason = `20${start}-${end}`;
      }
    }
    
    const days = parseInt(daysStr);
    if (!data[date]) data[date] = {};
    data[date][normalizedSeason] = days;
    if (location) data[date]['location'] = location;
    
    // Also store as entry for easier querying
    entries.push({
      date,
      location,
      season: normalizedSeason,
      days
    });
  }
  
  return { data, entries };
}

// Get widget-specific context prompt
function getWidgetContext(widget: string | null): string {
  switch (widget) {
    case 'about':
      return 'You are helping visitors learn about Jeremy. Focus on his background, career, experience, and interests.';
    case 'music':
      return 'You are discussing Jeremy\'s music taste, listening habits, favorite artists, and music recommendations.';
    case 'snowboarding':
      return 'You are discussing Jeremy\'s snowboarding activities, season progress, favorite mountains, and snowboarding experiences.';
    case 'biking':
      return 'You are discussing Jeremy\'s cycling activities, bike rides, Strava data, routes, and biking achievements.';
    case 'books':
      return 'You are discussing Jeremy\'s reading habits, currently reading books, favorite authors, and book recommendations.';
    case 'photos':
      return 'You are discussing Jeremy\'s photography, travel experiences, memories from photos, and photography style.';
    case 'site':
      return 'You are helping visitors understand how this website is built. Discuss the tech stack, architecture, APIs, and implementation details. The site uses React, TypeScript, Tailwind CSS, Vite, Vercel serverless functions, and integrates with Claude AI, Spotify, Strava, and Hardcover APIs.';
    default:
      return 'You are a helpful assistant for Jeremy\'s personal website. You can answer questions about any aspect of Jeremy\'s life, work, interests, and activities.';
  }
}

// Define tools for Claude
const tools = [
  {
    name: 'get_about_info',
    description: 'Get information about Jeremy\'s background, career, skills, interests, and personal details from the About Me document. Use this tool when asked about: career, work experience, job history, product management, skills, expertise, background, bio, personal information, location, interests, hobbies, education, or professional experience.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string' as const,
          description: 'What information to search for (e.g., "career", "skills", "hobbies", "location")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_photos_info',
    description: 'Get information about Jeremy\'s photos, travel experiences, photography style, and memories from the photo metadata. Use this tool when asked about: photography, photos, pictures, travel, trips, locations visited, places, memories, camera, photography style, or visual content.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string' as const,
          description: 'What to search for (e.g., "locations", "travel", "photography style", "specific trip")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_snowboarding_data',
    description: 'Get Jeremy\'s snowboarding statistics including days snowboarded, season progress, locations, dates, and historical data. Use this tool when asked about: snowboarding, skiing, winter sports, mountains, resorts, Breckenridge, Keystone, season progress, days snowboarded, snowboarding locations, or outdoor winter activities. Can answer questions about where he snowboards most, last time/location, total days, season comparisons, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        season: {
          type: 'string' as const,
          description: 'Which season to query (e.g., "2024-25", "2025-26", or "all"). Optional - if not provided, will use latest season.',
        },
        metric: {
          type: 'string' as const,
          description: 'What information to get: "total_days", "progress", "comparison", "locations", "most_common_location", "last_location", "last_date", or "all"',
        },
      },
      required: ['metric'],
    },
  },
  {
    name: 'get_biking_data',
    description: 'Get Jeremy\'s bike ride data from Strava API including distance, elevation, duration, and route information. Use this tool when asked about: biking, cycling, bike rides, Strava, distance, elevation, longest ride, recent rides, total distance, elevation gain, bike routes, or outdoor cycling activities.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string' as const,
          description: 'What to query (e.g., "last_ride", "total_distance", "elevation_gain", "longest_ride")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_books_data',
    description: 'Get Jeremy\'s reading data from Hardcover API including currently reading books, reading progress, and reading history. Use this tool when asked about: books, reading, currently reading, favorite books, book recommendations, authors, reading habits, or literature.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string' as const,
          description: 'What to query (e.g., "currently_reading", "recent_books", "reading_progress")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_music_data',
    description: 'Get Jeremy\'s music listening data from Spotify API including recently played tracks, top tracks, and listening statistics. Use this tool when asked about: music, songs, tracks, artists, Spotify, listening habits, favorite music, recently played, top songs, favorite artists, or music recommendations.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string' as const,
          description: 'What to query (e.g., "recent_tracks", "top_tracks", "favorite_artists")',
        },
      },
      required: ['query'],
    },
  },
];

// Helper function to send SSE event
function sendSSEEvent(res: VercelResponse, event: string, data: any) {
  const jsonData = JSON.stringify(data);
  res.write(`event: ${event}\n`);
  res.write(`data: ${jsonData}\n\n`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if client wants streaming (via query param or header)
  const useStreaming = req.query.stream === 'true' || req.headers['accept']?.includes('text/event-stream');
  
  if (useStreaming) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  }

  try {
    const { messages, activeWidget, conversationHistory = [] } = req.body as ChatRequest;

    if (!process.env.ANTHROPIC_API_KEY) {
      if (useStreaming) {
        sendSSEEvent(res, 'error', {
          error: 'ANTHROPIC_API_KEY not configured',
          message: 'Please set ANTHROPIC_API_KEY in your Vercel environment variables.'
        });
        res.end();
        return;
      }
      return res.status(500).json({ 
        error: 'ANTHROPIC_API_KEY not configured',
        message: 'Please set ANTHROPIC_API_KEY in your Vercel environment variables.'
      });
    }

    // Combine conversation history with current message
    const allMessages = [...conversationHistory, ...messages];

    // Build system prompt with widget context
    const widgetContext = getWidgetContext(activeWidget);
    const systemPrompt = `${widgetContext}

You have access to tools that let you retrieve information about Jeremy's:

1. About Me (get_about_info): Career, background, experience, skills, interests
2. Music (get_music_data): Listening habits, favorite artists, recently played tracks
3. Snowboarding (get_snowboarding_data): Season progress, locations, days snowboarded
4. Biking (get_biking_data): Rides, distance, elevation, Strava data
5. Books (get_books_data): Reading habits, currently reading, book recommendations
6. Photos (get_photos_info): Photography, travel, memories
7. Site (general knowledge): Technical details, architecture, implementation

PLANNING STEP: Before answering, analyze the user's query to determine which tools are relevant. If a query spans multiple topics, use multiple tools and synthesize the information.

Examples of multi-tool queries:
- "What outdoor activities does Jeremy do?" → use both get_biking_data and get_snowboarding_data
- "Tell me about Jeremy's hobbies and interests" → use get_about_info, get_biking_data, get_snowboarding_data, get_music_data, get_books_data
- "What does Jeremy do for fun?" → use multiple relevant tools based on context

When you begin processing a query, first provide a brief planning statement explaining which tools you'll use and why. Format this as: "I'll use [tool names] to answer this question about [topic]."

Use these tools to answer questions accurately. Be friendly, conversational, and helpful. Reference specific details when available.

If a tool call fails or data isn't available, gracefully explain that the information isn't currently available.`;

    // Call Claude API with retry logic
    let response;
    try {
      response = await retryWithBackoff(async () => {
        return await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: allMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        tools,
        });
      }, {
        maxRetries: 3,
        shouldRetry: (error: any) => {
          // Don't retry on authentication errors
          if (error.status === 401 || error.status === 403) {
            return false;
          }
          // Retry on rate limits and server errors
          return error.status === 529 || 
                 error.status >= 500 || 
                 error.message?.includes('overloaded') || 
                 error.message?.includes('Overloaded');
        },
      });
    } catch (apiError: any) {
      // Handle Anthropic API errors
      if (apiError.status === 529 || apiError.message?.includes('overloaded') || apiError.message?.includes('Overloaded')) {
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'The AI service is currently overloaded. Please try again in a few moments.',
        });
      }
      // Re-throw to be caught by outer catch block
      throw apiError;
    }

    // Handle tool use if present
    let finalContent = '';
    let toolResults: any[] = [];
    let planningInfo: { tools: string[]; reasoning: string } | null = null;

    if (!response.content || response.content.length === 0) {
      if (useStreaming) {
        sendSSEEvent(res, 'error', {
          error: 'Empty response from Claude API',
          message: 'The AI response was empty. Please try again.'
        });
        res.end();
        return;
      }
      return res.status(500).json({
        error: 'Empty response from Claude API',
        message: 'The AI response was empty. Please try again.',
      });
    }

    // Extract planning information from response
    const textContent = response.content.find((item: any) => item.type === 'text');
    const toolCalls = response.content.filter((item: any) => item.type === 'tool_use') as any[];
    
    // Extract planning from text content or tool calls
    if (toolCalls.length > 0) {
      const toolsUsed = toolCalls.map((tc: any) => tc.name);
      let reasoning = '';
      
      if (textContent && textContent.text) {
        // Look for planning statement in text (e.g., "I'll use [tools] to answer...")
        const planningMatch = textContent.text.match(/I'll use (?:the )?([^.]+?)(?: tool)?(?:s)? (?:to|for)/i) ||
                             textContent.text.match(/I'll (?:use|check|query) (?:the )?([^.]+?)(?: tool)?(?:s)?/i) ||
                             textContent.text.match(/I'll (?:gather|retrieve|get) (?:information|data) (?:from|using) (?:the )?([^.]+?)(?: tool)?(?:s)?/i);
        
        if (planningMatch) {
          // Extract the first sentence or up to 200 chars
          const firstSentence = textContent.text.split(/[.!?]/)[0];
          reasoning = firstSentence.length > 200 
            ? firstSentence.substring(0, 200) + '...'
            : firstSentence;
        } else {
          // Generate reasoning from tool names
          const toolNamesReadable = toolsUsed.map(name => {
            return name.replace('get_', '').replace('_', ' ').replace(/_/g, ' ');
          }).join(', ');
          reasoning = `I'll use ${toolNamesReadable} to answer this question.`;
        }
      } else {
        // No text content, generate reasoning from tool names
        const toolNamesReadable = toolsUsed.map(name => {
          return name.replace('get_', '').replace('_', ' ').replace(/_/g, ' ');
        }).join(', ');
        reasoning = `I'll use ${toolNamesReadable} to answer this question.`;
      }
      
      planningInfo = {
        tools: toolsUsed,
        reasoning: reasoning
      };
      
      // Send planning event immediately via SSE if streaming
      if (useStreaming && planningInfo) {
        sendSSEEvent(res, 'planning', planningInfo);
      }
    } else if (textContent && textContent.text) {
      // No tool calls, but check if there's a planning statement in text
      const planningMatch = textContent.text.match(/I'll use (?:the )?([^.]+?)(?: tool)?(?:s)? (?:to|for)/i) ||
                           textContent.text.match(/I'll (?:use|check|query) (?:the )?([^.]+?)(?: tool)?(?:s)?/i);
      
      if (planningMatch) {
        const firstSentence = textContent.text.split(/[.!?]/)[0];
        planningInfo = {
          tools: [],
          reasoning: firstSentence.length > 200 
            ? firstSentence.substring(0, 200) + '...'
            : firstSentence
        };
        
        // Send planning event immediately via SSE if streaming
        if (useStreaming && planningInfo) {
          sendSSEEvent(res, 'planning', planningInfo);
        }
      }
    }

    // Check if we have tool calls - if so, we need to process them and get a follow-up response
    const hasToolCalls = toolCalls.length > 0;
    
    if (!hasToolCalls && response.content[0].type === 'text') {
      // Simple text response, no tools needed
      finalContent = response.content[0].text;
    } else if (hasToolCalls) {
      // Process tool calls and get follow-up response
      
      for (const toolCall of toolCalls) {
        let toolResult: any;
        
        try {
          switch (toolCall.name) {
            case 'get_about_info':
              toolResult = {
                tool_use_id: toolCall.id,
                content: aboutMeContent,
              };
              break;
              
            case 'get_photos_info':
              toolResult = {
                tool_use_id: toolCall.id,
                content: photosContent,
              };
              break;
              
            case 'get_snowboarding_data':
              const { data: snowboardingData, entries: allEntries } = parseSnowboardingData();
              const { season, metric } = toolCall.input;
              let result = '';
              
              // Get all seasons from data
              const allSeasons = new Set<string>();
              Object.values(snowboardingData).forEach(data => {
                Object.keys(data).forEach(key => {
                  if (key !== 'location') allSeasons.add(key);
                });
              });
              
              // Determine which season to query (default to latest if not specified)
              const targetSeason = season || Array.from(allSeasons).sort().reverse()[0];
              const seasonEntries = targetSeason === 'all' 
                ? allEntries 
                : allEntries.filter(e => e.season === targetSeason);
              
              if (metric === 'total_days' || metric === 'progress') {
                const seasons = season === 'all' ? Array.from(allSeasons) : [targetSeason];
                seasons.forEach(s => {
                  const entries = Object.entries(snowboardingData).filter(([_, data]) => data[s]);
                  if (entries.length > 0) {
                    const lastEntry = entries[entries.length - 1];
                    const location = lastEntry[1].location || 'Unknown';
                    result += `${s}: ${lastEntry[1][s]} days (Last location: ${location})\n`;
                  }
                });
              } else if (metric === 'comparison') {
                // Get latest season and previous season
                const sortedSeasons = Array.from(allSeasons).sort().reverse();
                if (sortedSeasons.length >= 2) {
                  const currentSeason = sortedSeasons[0];
                  const previousSeason = sortedSeasons[1];
                  const currentData = Object.entries(snowboardingData).filter(([_, d]) => d[currentSeason]);
                  const previousData = Object.entries(snowboardingData).filter(([_, d]) => d[previousSeason]);
                  const currentDays = currentData[currentData.length - 1]?.[1][currentSeason] || 0;
                  const previousDays = previousData[previousData.length - 1]?.[1][previousSeason] || 0;
                  result = `${currentSeason} season: ${currentDays} days\n${previousSeason} season: ${previousDays} days`;
                } else {
                  result = JSON.stringify(snowboardingData);
                }
              } else if (metric === 'locations' || metric === 'all') {
                // Return all entries with locations for the season
                result = `Snowboarding entries for ${targetSeason}:\n`;
                seasonEntries.forEach(e => {
                  result += `${e.date}: ${e.location} (${e.days} days)\n`;
                });
              } else if (metric === 'most_common_location') {
                // Count locations for the season
                const locationCount: Record<string, number> = {};
                seasonEntries.forEach(e => {
                  locationCount[e.location] = (locationCount[e.location] || 0) + 1;
                });
                const sortedLocations = Object.entries(locationCount).sort((a, b) => b[1] - a[1]);
                if (sortedLocations.length > 0) {
                  const [mostCommon, count] = sortedLocations[0];
                  result = `Most common location: ${mostCommon} (${count} ${count === 1 ? 'time' : 'times'})\n`;
                  if (sortedLocations.length > 1) {
                    result += `\nAll locations:\n`;
                    sortedLocations.forEach(([loc, cnt]) => {
                      result += `- ${loc}: ${cnt} ${cnt === 1 ? 'time' : 'times'}\n`;
                    });
                  }
                } else {
                  result = 'No location data available.';
                }
              } else if (metric === 'last_location' || metric === 'last_date') {
                // Get most recent entry
                if (seasonEntries.length > 0) {
                  const lastEntry = seasonEntries[seasonEntries.length - 1];
                  if (metric === 'last_location') {
                    result = `Last location: ${lastEntry.location} (on ${lastEntry.date})\n`;
                  } else {
                    result = `Last time snowboarding: ${lastEntry.date} at ${lastEntry.location} (Day ${lastEntry.days} of the season)\n`;
                  }
                } else {
                  result = 'No snowboarding data available for this season.';
                }
              } else {
                // Default: return all data
                result = `Snowboarding data:\n`;
                seasonEntries.forEach(e => {
                  result += `${e.date}: ${e.location} (${e.season}, Day ${e.days})\n`;
                });
              }
              
              toolResult = {
                tool_use_id: toolCall.id,
                content: result || 'No snowboarding data available.',
              };
              break;
              
            case 'get_biking_data':
              try {
                const { query } = toolCall.input;
                const accessToken = await getValidStravaToken();

                if (!accessToken) {
                  toolResult = {
                    tool_use_id: toolCall.id,
                    content: 'Strava API is not configured. Please set STRAVA_ACCESS_TOKEN or STRAVA_CLIENT_ID/STRAVA_CLIENT_SECRET/STRAVA_REFRESH_TOKEN in environment variables.',
                  };
                  break;
                }

                let result = '';

                if (query === 'last_ride' || query === 'recent_ride' || query === 'latest_ride') {
                  // Fetch the latest bike activity
                  const response = await fetch(
                    'https://www.strava.com/api/v3/athlete/activities?per_page=10',
                    {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                      },
                    }
                  );

                  if (!response.ok) {
                    throw new Error(`Strava API error: ${response.status}`);
                  }

                  const activities = await response.json();
                  const bikeActivities = activities.filter((activity: any) => activity.type === 'Ride');
                  
                  if (bikeActivities.length === 0) {
                    result = 'No bike rides found in recent activities.';
                  } else {
                    const latestActivity = bikeActivities[0];
                    
                    // Fetch detailed activity info
                    const detailResponse = await fetch(
                      `https://www.strava.com/api/v3/activities/${latestActivity.id}`,
                      {
                        headers: {
                          Authorization: `Bearer ${accessToken}`,
                        },
                      }
                    );

                    if (detailResponse.ok) {
                      const detailedActivity = await detailResponse.json();
                      const distanceKm = (detailedActivity.distance / 1000).toFixed(2);
                      const distanceMiles = (detailedActivity.distance * 0.000621371).toFixed(2);
                      const elevationFeet = Math.round(detailedActivity.total_elevation_gain * 3.28084);
                      const hours = Math.floor(detailedActivity.moving_time / 3600);
                      const minutes = Math.floor((detailedActivity.moving_time % 3600) / 60);
                      const date = new Date(detailedActivity.start_date_local).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      });
                      
                      result = `Last bike ride:\n`;
                      result += `- Date: ${date}\n`;
                      result += `- Name: ${detailedActivity.name}\n`;
                      result += `- Distance: ${distanceMiles} miles (${distanceKm} km)\n`;
                      result += `- Elevation gain: ${elevationFeet} ft (${Math.round(detailedActivity.total_elevation_gain)} m)\n`;
                      result += `- Duration: ${hours > 0 ? `${hours}h ` : ''}${minutes}m\n`;
                      if (detailedActivity.location_city && detailedActivity.location_state) {
                        result += `- Location: ${detailedActivity.location_city}, ${detailedActivity.location_state}\n`;
                      }
                    } else {
                      // Fallback to basic activity data
                      const distanceMiles = (latestActivity.distance * 0.000621371).toFixed(2);
                      result = `Last bike ride: ${latestActivity.name} - ${distanceMiles} miles on ${new Date(latestActivity.start_date_local).toLocaleDateString()}`;
                    }
                  }
                } else if (query === 'recent_rides' || query === 'recent_activities') {
                  const response = await fetch(
                    'https://www.strava.com/api/v3/athlete/activities?per_page=10',
                    {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                      },
                    }
                  );

                  if (!response.ok) {
                    throw new Error(`Strava API error: ${response.status}`);
                  }

                  const activities = await response.json();
                  const bikeActivities = activities.filter((activity: any) => activity.type === 'Ride');
                  
                  if (bikeActivities.length === 0) {
                    result = 'No recent bike rides found.';
                  } else {
                    result = `Recent bike rides (${bikeActivities.length}):\n`;
                    bikeActivities.slice(0, 5).forEach((activity: any, index: number) => {
                      const distanceMiles = (activity.distance * 0.000621371).toFixed(1);
                      const date = new Date(activity.start_date_local).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      });
                      result += `${index + 1}. ${activity.name} - ${distanceMiles} mi on ${date}\n`;
                    });
                  }
                } else if (query === 'total_distance' || query === 'total_miles' || query === 'total_km') {
                  const response = await fetch(
                    'https://www.strava.com/api/v3/athlete/activities?per_page=200',
                    {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                      },
                    }
                  );

                  if (!response.ok) {
                    throw new Error(`Strava API error: ${response.status}`);
                  }

                  const activities = await response.json();
                  const bikeActivities = activities.filter((activity: any) => activity.type === 'Ride');
                  
                  if (bikeActivities.length === 0) {
                    result = 'No bike rides found to calculate total distance.';
                  } else {
                    const totalMeters = bikeActivities.reduce((sum: number, activity: any) => sum + activity.distance, 0);
                    const totalMiles = (totalMeters * 0.000621371).toFixed(1);
                    const totalKm = (totalMeters / 1000).toFixed(1);
                    result = `Total distance from last ${bikeActivities.length} rides:\n`;
                    result += `- ${totalMiles} miles (${totalKm} km)\n`;
                    result += `- Based on ${bikeActivities.length} bike activities`;
                  }
                } else if (query === 'elevation_gain' || query === 'total_elevation') {
                  const response = await fetch(
                    'https://www.strava.com/api/v3/athlete/activities?per_page=200',
                    {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                      },
                    }
                  );

                  if (!response.ok) {
                    throw new Error(`Strava API error: ${response.status}`);
                  }

                  const activities = await response.json();
                  const bikeActivities = activities.filter((activity: any) => activity.type === 'Ride');
                  
                  if (bikeActivities.length === 0) {
                    result = 'No bike rides found to calculate elevation gain.';
                  } else {
                    const totalElevation = bikeActivities.reduce((sum: number, activity: any) => sum + (activity.total_elevation_gain || 0), 0);
                    const totalFeet = Math.round(totalElevation * 3.28084);
                    result = `Total elevation gain from last ${bikeActivities.length} rides:\n`;
                    result += `- ${totalFeet} ft (${Math.round(totalElevation)} m)\n`;
                    result += `- Based on ${bikeActivities.length} bike activities`;
                  }
                } else if (query === 'longest_ride' || query === 'longest_distance') {
                  const response = await fetch(
                    'https://www.strava.com/api/v3/athlete/activities?per_page=200',
                    {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                      },
                    }
                  );

                  if (!response.ok) {
                    throw new Error(`Strava API error: ${response.status}`);
                  }

                  const activities = await response.json();
                  const bikeActivities = activities.filter((activity: any) => activity.type === 'Ride');
                  
                  if (bikeActivities.length === 0) {
                    result = 'No bike rides found.';
                  } else {
                    const longest = bikeActivities.reduce((longest: any, activity: any) => 
                      activity.distance > longest.distance ? activity : longest
                    );
                    const distanceMiles = (longest.distance * 0.000621371).toFixed(2);
                    const distanceKm = (longest.distance / 1000).toFixed(2);
                    const date = new Date(longest.start_date_local).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    });
                    result = `Longest ride:\n`;
                    result += `- ${longest.name}\n`;
                    result += `- Distance: ${distanceMiles} miles (${distanceKm} km)\n`;
                    result += `- Date: ${date}\n`;
                  }
                } else {
                  // Default: get last ride info
                  const response = await fetch(
                    'https://www.strava.com/api/v3/athlete/activities?per_page=1',
                    {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                      },
                    }
                  );

                  if (response.ok) {
                    const activities = await response.json();
                    const bikeActivities = activities.filter((activity: any) => activity.type === 'Ride');
                    if (bikeActivities.length > 0) {
                      const latest = bikeActivities[0];
                      const distanceMiles = (latest.distance * 0.000621371).toFixed(2);
                      result = `Latest bike ride: ${latest.name} - ${distanceMiles} miles on ${new Date(latest.start_date_local).toLocaleDateString()}`;
                    } else {
                      result = 'No bike rides found.';
                    }
                  } else {
                    throw new Error(`Strava API error: ${response.status}`);
                  }
                }

                toolResult = {
                  tool_use_id: toolCall.id,
                  content: result || 'No biking data available.',
                };
              } catch (error: any) {
                toolResult = {
                  tool_use_id: toolCall.id,
                  content: `Error fetching biking data: ${error.message}. Please ensure Strava API is properly configured.`,
                };
              }
              break;
              
            case 'get_books_data':
              // For now, return placeholder since we need Hardcover API integration
              toolResult = {
                tool_use_id: toolCall.id,
                content: 'Book reading data would come from Hardcover API. Currently using mock data in the widget. To enable this, configure Hardcover API credentials.',
              };
              break;
              
            case 'get_music_data':
              try {
                const { query } = toolCall.input;
                const accessToken = process.env.SPOTIFY_ACCESS_TOKEN || 
                  (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET 
                    ? await refreshSpotifyToken() 
                    : null);

                if (!accessToken) {
                  toolResult = {
                    tool_use_id: toolCall.id,
                    content: 'Spotify API is not configured. Please set SPOTIFY_ACCESS_TOKEN or SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET in environment variables.',
                  };
                  break;
                }

                let result = '';

                if (query === 'recent_tracks' || query === 'recently_played') {
                  const response = await fetch(
                    'https://api.spotify.com/v1/me/player/recently-played?limit=15',
                    {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                      },
                    }
                  );

                  if (!response.ok) {
                    throw new Error(`Spotify API error: ${response.status}`);
                  }

                  const data = await response.json();
                  result = 'Recently played tracks:\n';
                  data.items.forEach((item: any, index: number) => {
                    const track = item.track;
                    const artists = track.artists.map((a: any) => a.name).join(', ');
                    result += `${index + 1}. "${track.name}" by ${artists}\n`;
                  });
                } else if (query === 'top_tracks' || query === 'favorite_tracks') {
                  const response = await fetch(
                    'https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=15',
                    {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                      },
                    }
                  );

                  if (!response.ok) {
                    throw new Error(`Spotify API error: ${response.status}`);
                  }

                  const data = await response.json();
                  result = 'Top tracks (all time):\n';
                  data.items.forEach((track: any, index: number) => {
                    const artists = track.artists.map((a: any) => a.name).join(', ');
                    result += `${index + 1}. "${track.name}" by ${artists}\n`;
                  });
                } else if (query === 'favorite_artists' || query === 'top_artists') {
                  const response = await fetch(
                    'https://api.spotify.com/v1/me/top/artists?time_range=long_term&limit=10',
                    {
                      headers: {
                        Authorization: `Bearer ${accessToken}`,
                      },
                    }
                  );

                  if (!response.ok) {
                    throw new Error(`Spotify API error: ${response.status}`);
                  }

                  const data = await response.json();
                  result = 'Top artists (all time):\n';
                  data.items.forEach((artist: any, index: number) => {
                    result += `${index + 1}. ${artist.name}\n`;
                  });
                } else {
                  // Default: get both recent and top tracks
                  const [recentResponse, topResponse] = await Promise.all([
                    fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
                      headers: { Authorization: `Bearer ${accessToken}` },
                    }),
                    fetch('https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=5', {
                      headers: { Authorization: `Bearer ${accessToken}` },
                    }),
                  ]);

                  if (recentResponse.ok && topResponse.ok) {
                    const recentData = await recentResponse.json();
                    const topData = await topResponse.json();
                    
                    result = 'Recent listening activity:\n';
                    result += 'Recently played:\n';
                    recentData.items.slice(0, 3).forEach((item: any) => {
                      const track = item.track;
                      const artists = track.artists.map((a: any) => a.name).join(', ');
                      result += `- "${track.name}" by ${artists}\n`;
                    });
                    
                    result += '\nTop tracks:\n';
                    topData.items.slice(0, 3).forEach((track: any, index: number) => {
                      const artists = track.artists.map((a: any) => a.name).join(', ');
                      result += `${index + 1}. "${track.name}" by ${artists}\n`;
                    });
                  } else {
                    throw new Error('Failed to fetch music data');
                  }
                }

                toolResult = {
                  tool_use_id: toolCall.id,
                  content: result || 'No music data available.',
                };
              } catch (error: any) {
                toolResult = {
                  tool_use_id: toolCall.id,
                  content: `Error fetching music data: ${error.message}. Please ensure Spotify API is properly configured.`,
                };
              }
              break;
              
            default:
              toolResult = {
                tool_use_id: toolCall.id,
                content: 'Unknown tool requested.',
              };
          }
        } catch (error: any) {
          toolResult = {
            tool_use_id: toolCall.id,
            content: `Error: ${error.message}`,
          };
        }
        
        toolResults.push(toolResult);
      }

      // Make a follow-up call with tool results
      let followUpResponse;
      try {
        followUpResponse = await retryWithBackoff(async () => {
          return await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            ...allMessages.map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            })),
            {
              role: 'assistant',
              content: response.content,
            },
            {
              role: 'user',
              content: toolResults.map(tr => ({
                type: 'tool_result' as const,
                tool_use_id: tr.tool_use_id,
                content: tr.content,
                is_error: false,
              })),
            },
          ] as any,
          });
        }, {
          maxRetries: 3,
          shouldRetry: (error: any) => {
            // Don't retry on authentication errors
            if (error.status === 401 || error.status === 403) {
              return false;
            }
            // Retry on rate limits and server errors
            return error.status === 529 || 
                   error.status >= 500 || 
                   error.message?.includes('overloaded') || 
                   error.message?.includes('Overloaded');
          },
        });
      } catch (apiError: any) {
        // Handle Anthropic API errors
        if (apiError.status === 529 || apiError.message?.includes('overloaded') || apiError.message?.includes('Overloaded')) {
          if (useStreaming) {
            sendSSEEvent(res, 'error', {
              error: 'Service temporarily unavailable',
              message: 'The AI service is currently overloaded. Please try again in a few moments.'
            });
            res.end();
            return;
          }
          return res.status(503).json({
            error: 'Service temporarily unavailable',
            message: 'The AI service is currently overloaded. Please try again in a few moments.',
          });
        }
        // Re-throw to be caught by outer catch block
        throw apiError;
      }

      // Process follow-up response
      if (!followUpResponse || !followUpResponse.content || followUpResponse.content.length === 0) {
        console.error('Empty followUpResponse');
        finalContent = 'I encountered an issue processing your request. Please try again.';
      } else {
        // Find the first text content in the response
        const textContent = followUpResponse.content.find((item: any) => item.type === 'text');
        if (textContent && textContent.text && textContent.text.trim()) {
          finalContent = textContent.text;
        } else {
          // If no text content, try to extract from any content
          const anyText = followUpResponse.content.find((item: any) => item.text);
          finalContent = anyText?.text || 'I encountered an issue processing your request. Please try again.';
        }
      }
    } else {
      // No tool calls, use the text response directly
      if (response.content[0] && response.content[0].type === 'text') {
        finalContent = response.content[0].text;
      } else {
        finalContent = 'I encountered an issue processing your request. Please try again.';
      }
    }
    
    // Ensure we always have content
    if (!finalContent || finalContent.trim() === '') {
      console.error('Empty finalContent - response:', response.content, 'followUpResponse:', followUpResponse?.content);
      finalContent = 'I encountered an issue processing your request. Please try again.';
    }

    // Log for debugging
    console.log('Returning response:', {
      hasMessage: !!finalContent,
      messageLength: finalContent?.length,
      messagePreview: finalContent?.substring(0, 100),
      hasPlanning: !!planningInfo,
      planningTools: planningInfo?.tools,
      planningReasoning: planningInfo?.reasoning?.substring(0, 50),
      hasToolCalls: hasToolCalls,
      toolResultsCount: toolResults.length,
      useStreaming
    });

    // Send response via SSE if streaming, otherwise use JSON
    if (useStreaming) {
      sendSSEEvent(res, 'response', {
        message: finalContent,
        toolResults: toolResults.length > 0 ? toolResults : undefined,
      });
      sendSSEEvent(res, 'done', {});
      res.end();
      return;
    }

    // Non-streaming response (backward compatible)
    const responseData = {
      message: finalContent,
      planning: planningInfo || undefined,
      toolResults: toolResults.length > 0 ? toolResults : undefined,
    };

    console.log('Response data structure:', JSON.stringify(responseData, null, 2).substring(0, 500));

    return res.status(200).json(responseData);
  } catch (error: any) {
    console.error('Chat API error:', error);
    
    // Handle Anthropic API errors
    if (error.status === 529 || error.message?.includes('overloaded') || error.message?.includes('Overloaded')) {
      if (useStreaming) {
        sendSSEEvent(res, 'error', {
          error: 'Service temporarily unavailable',
          message: 'The AI service is currently overloaded. Please try again in a few moments.'
        });
        res.end();
        return;
      }
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'The AI service is currently overloaded. Please try again in a few moments.',
      });
    }
    
    if (useStreaming) {
      sendSSEEvent(res, 'error', {
        error: 'Internal server error',
        message: error.message || 'An error occurred while processing your request.'
      });
      res.end();
      return;
    }
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An error occurred while processing your request.',
    });
  }
}

