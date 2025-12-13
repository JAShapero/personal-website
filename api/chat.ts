import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

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
    default:
      return 'You are a helpful assistant for Jeremy\'s personal website.';
  }
}

// Define tools for Claude
const tools = [
  {
    name: 'get_about_info',
    description: 'Get information about Jeremy\'s background, career, skills, interests, and personal details from the About Me document.',
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
    description: 'Get information about Jeremy\'s photos, travel experiences, photography style, and memories from the photo metadata.',
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
    description: 'Get Jeremy\'s snowboarding statistics including days snowboarded, season progress, locations, dates, and historical data. Can answer questions about where he snowboards most, last time/location, total days, season comparisons, etc.',
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
    description: 'Get Jeremy\'s bike ride data from Strava API including distance, elevation, duration, and route information.',
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
    description: 'Get Jeremy\'s reading data from Hardcover API including currently reading books, reading progress, and reading history.',
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
    description: 'Get Jeremy\'s music listening data from Spotify API including recently played tracks, top tracks, and listening statistics.',
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

  try {
    const { messages, activeWidget, conversationHistory = [] } = req.body as ChatRequest;

    if (!process.env.ANTHROPIC_API_KEY) {
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
- About Me information (background, career, interests)
- Photos and travel experiences
- Snowboarding statistics and season data
- Biking/cycling activities and Strava data
- Books and reading habits
- Music listening habits and Spotify data

Use these tools to answer questions accurately. Be friendly, conversational, and helpful. Reference specific details when available.

If a tool call fails or data isn't available, gracefully explain that the information isn't currently available.`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: allMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      tools,
    });

    // Handle tool use if present
    let finalContent = '';
    let toolResults: any[] = [];

    if (!response.content || response.content.length === 0) {
      return res.status(500).json({
        error: 'Empty response from Claude API',
        message: 'The AI response was empty. Please try again.',
      });
    }

    if (response.content[0].type === 'text') {
      finalContent = response.content[0].text;
    } else if (response.content[0].type === 'tool_use') {
      // Process tool calls
      const toolCalls = response.content.filter((item: any) => item.type === 'tool_use') as any[];
      
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
              // For now, return placeholder since we need Strava API integration
              toolResult = {
                tool_use_id: toolCall.id,
                content: 'Bike ride data would come from Strava API. Currently using mock data in the widget. To enable this, configure Strava API credentials.',
              };
              break;
              
            case 'get_books_data':
              // For now, return placeholder since we need Hardcover API integration
              toolResult = {
                tool_use_id: toolCall.id,
                content: 'Book reading data would come from Hardcover API. Currently using mock data in the widget. To enable this, configure Hardcover API credentials.',
              };
              break;
              
            case 'get_music_data':
              // For now, return placeholder since we need Spotify API integration
              toolResult = {
                tool_use_id: toolCall.id,
                content: 'Music listening data would come from Spotify API. Currently using mock data in the widget. To enable this, configure Spotify API credentials.',
              };
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
      const followUpResponse = await anthropic.messages.create({
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

      if (!followUpResponse.content || followUpResponse.content.length === 0) {
        finalContent = 'I encountered an issue processing your request. Please try again.';
      } else if (followUpResponse.content[0].type === 'text') {
        finalContent = followUpResponse.content[0].text;
      } else {
        finalContent = 'I encountered an issue processing your request.';
      }
    } else {
      finalContent = 'I encountered an issue processing your request.';
    }

    return res.status(200).json({
      message: finalContent,
      toolResults: toolResults.length > 0 ? toolResults : undefined,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An error occurred while processing your request.',
    });
  }
}

