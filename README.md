
# Personal Website with Widgets

A personal website featuring interactive widgets with an AI-powered contextual chat system. Built with React, TypeScript, Tailwind CSS, and Claude API.

---

## Features

- **6 Interactive Widgets**: About Me, Music, Snowboarding, Biking, Books, and Photos
- **AI Chat System**: Contextual chat powered by Claude API that responds based on active widget
- **Drag & Drop**: Rearrangeable widgets with position persistence
- **Dark/Light Theme**: Beautiful theme toggle with system preference support
- **API Integrations**: Spotify, Strava, Hardcover (optional), and Claude (required)

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
   - Optional: `SPOTIFY_ACCESS_TOKEN`, `STRAVA_ACCESS_TOKEN`, `HARDCOVER_API_KEY`
4. Deploy!

## Setup Guide

See **[docs/API_SETUP.md](./docs/API_SETUP.md)** for detailed API setup instructions.

## Project Structure

```
/
├── api/
│   └── chat.ts           # Vercel serverless function for Claude API
├── src/
│   ├── components/       # React components
│   │   ├── ChatPanel.tsx
│   │   ├── AboutWidget.tsx
│   │   ├── MusicWidget.tsx
│   │   └── ...
│   ├── data/            # Data files
│   │   ├── about-me.md
│   │   ├── photos.md
│   │   └── snowboarding.csv
│   └── App.tsx          # Main app component
├── docs/
│   └── API_SETUP.md     # API setup documentation
└── vercel.json          # Vercel configuration
```

## Technologies

- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4
- **Animations**: Motion (motion/react)
- **Charts**: Recharts
- **Drag & Drop**: react-dnd
- **AI**: Anthropic Claude API
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

## License

Private project - All rights reserved.
  