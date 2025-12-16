
# Personal Website with Widgets

A personal website featuring interactive widgets with an AI-powered chat. Built with React, TypeScript, Tailwind CSS, and Claude API.

---

## Features

- **5 Interactive Widgets**: About Me, About Site, Music, Snowboarding, and Biking
- **AI Chat System**: Intelligent chat powered by Claude API with automatic tool routing and multi-source data synthesis
- **Drag & Drop**: Rearrangeable widgets with position persistence
- **Dark/Light Theme**: Beautiful theme toggle with system preference support
- **API Integrations**: Spotify, Strava, Hardcover (optional), LangSmith (optional), and Claude (required)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file (for local development):

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Required**: Get your Claude API key from https://console.anthropic.com/

### 3. Run Locally

For full functionality (including API functions):
```bash
npm install -g vercel
vercel dev
```

Or for frontend-only development:
```bash
npm run dev
```

### 4. Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `ANTHROPIC_API_KEY` (required)
   - Optional for Spotify: `SPOTIFY_ACCESS_TOKEN` OR (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`)
   - Optional for Strava: `STRAVA_ACCESS_TOKEN` OR (`STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REFRESH_TOKEN`)
   - Optional for Hardcover: `HARDCOVER_API_TOKEN`
4. Deploy!

## Setup Guides

- **[Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - Complete guide for getting your site hosted with a custom domain
- **[API Setup Guide](./docs/API_SETUP.md)** - Detailed API setup instructions

## Project Structure

```
/
├── api/
│   ├── chat.ts          # Vercel serverless function for Claude API
│   ├── spotify.ts       # Spotify API integration
│   ├── strava.ts        # Strava API integration
│   ├── hardcover.ts     # Hardcover API integration
│   └── retry.ts         # Retry utility for API calls
├── src/
│   ├── components/      # React components
│   │   ├── ChatPanel.tsx
│   │   ├── AboutWidget.tsx
│   │   ├── AboutSiteWidget.tsx
│   │   ├── MusicWidget.tsx
│   │   ├── BikeWidget.tsx
│   │   ├── SnowboardingWidget.tsx
│   │   ├── BooksWidget.tsx
│   │   ├── DraggableWidget.tsx
│   │   └── ui/          # shadcn/ui components
│   ├── data/            # Data files
│   │   ├── about-me.md
│   │   ├── photos.md
│   │   └── snowboarding.csv
│   └── App.tsx          # Main app component
├── docs/
│   ├── API_SETUP.md     # API setup documentation
│   ├── DEPLOYMENT_GUIDE.md
│   ├── SPOTIFY_TOKEN_SETUP.md
│   ├── STRAVA_SETUP.md
│   └── HARDCOVER_SETUP.md
└── vercel.json          # Vercel configuration
```

## Technologies

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Animations**: Motion (motion/react)
- **Charts**: Recharts
- **Maps**: Leaflet
- **Drag & Drop**: react-dnd
- **AI**: Anthropic Claude API (Claude Sonnet 4)
- **Hosting**: Vercel (serverless functions)

## Development

```bash
# Install dependencies
npm install

# Run development server (frontend only)
npm run dev

# Run with Vercel functions (full stack)
vercel dev

# Build for production
npm run build
```

## Environment Variables

### Required
- `ANTHROPIC_API_KEY` - Claude API key for the chat system

### Optional (for widget functionality)
- **Spotify** (Music Widget):
  - `SPOTIFY_ACCESS_TOKEN` (expires after 1 hour), OR
  - `SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET` + `SPOTIFY_REFRESH_TOKEN` (recommended for auto-refresh)
  
- **Strava** (Biking Widget):
  - `STRAVA_ACCESS_TOKEN` (expires after 6 hours), OR
  - `STRAVA_CLIENT_ID` + `STRAVA_CLIENT_SECRET` + `STRAVA_REFRESH_TOKEN` (recommended for auto-refresh)
  
- **Hardcover** (Books Widget):
  - `HARDCOVER_API_TOKEN`

See [API_SETUP.md](./docs/API_SETUP.md) for detailed setup instructions.

## Security

- All API keys are stored as environment variables (never committed to git)
- `.env` files are gitignored
- Serverless functions run on Vercel (keys never exposed to client-side code)

## License

Private project - All rights reserved.
