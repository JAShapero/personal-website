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

// Parse snowboarding CSV data
function parseSnowboardingData() {
  const lines = snowboardingCsvContent.trim().split('\n');
  const data: Record<string, { [season: string]: number }> = {};
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const [date, season, days] = lines[i].split(',');
    if (!data[date]) data[date] = {};
    data[date][season] = parseInt(days);
  }
  
  return data;
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
    description: 'Get Jeremy\'s snowboarding statistics including days snowboarded, season progress, and historical data.',
    input_schema: {
      type: 'object' as const,
      properties: {
        season: {
          type: 'string' as const,
          description: 'Which season to query (e.g., "2023-24", "2022-23", or "all")',
        },
        metric: {
          type: 'string' as const,
          description: 'What metric to get (e.g., "total_days", "progress", "comparison")',
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
      model: 'claude-3-5-sonnet-20240620',
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
              const snowboardingData = parseSnowboardingData();
              const { season, metric } = toolCall.input;
              let result = '';
              
              if (metric === 'total_days') {
                const seasons = season === 'all' ? ['2023-24', '2022-23'] : [season];
                seasons.forEach(s => {
                  const entries = Object.entries(snowboardingData).filter(([_, data]) => data[s]);
                  if (entries.length > 0) {
                    const lastEntry = entries[entries.length - 1];
                    result += `${s}: ${lastEntry[1][s]} days\n`;
                  }
                });
              } else if (metric === 'comparison') {
                const data2022 = Object.entries(snowboardingData).filter(([_, d]) => d['2022-23']);
                const data2023 = Object.entries(snowboardingData).filter(([_, d]) => d['2023-24']);
                const last2022 = data2022[data2022.length - 1]?.[1]['2022-23'] || 0;
                const last2023 = data2023[data2023.length - 1]?.[1]['2023-24'] || 0;
                result = `2022-23 season: ${last2022} days\n2023-24 season: ${last2023} days`;
              }
              
              toolResult = {
                tool_use_id: toolCall.id,
                content: result || JSON.stringify(snowboardingData),
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
        model: 'claude-3-5-sonnet-20240620',
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

      if (followUpResponse.content[0].type === 'text') {
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

