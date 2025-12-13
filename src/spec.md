# Personal Website Specification

## Overview
A personal website featuring interactive widgets with a contextual chat system that responds based on which widget is currently active. The site includes draggable/rearrangeable widgets and multiple visual theme options.

## Core Features

### 1. Widget System
All widgets are draggable and rearrangeable using `react-dnd` for a customizable layout.

#### About Me Widget
- Displays personal bio and information
- Static content widget
- When active: Chat focuses on personal background, career, interests

#### Music Widget
- **Data Source**: Spotify API
- **API Endpoints**:
  - Recently Played: `/me/player/recently-played?limit=15`
  - Top Tracks: `/me/top/tracks?limit=15&time_range=long_term`
- **OAuth Scopes**: `user-read-recently-played`, `user-top-read`
- **Features**:
  - Toggle between "Recently Played" and "All Time" views
  - Shows 15 songs per view
  - Display height: 3.5 songs visible (200px max-height)
  - Scrollable list with custom scrollbar styling
  - Loading states and error handling with fallback to mock data
- When active: Chat discusses music taste, recommendations, artists

#### Snowboarding Widget
- **Visualization**: Line chart comparing days snowboarded across two winter seasons
- **Chart Library**: Recharts
- **Data**: Two seasons of snowboarding activity data
- When active: Chat discusses snowboarding, mountain conditions, season performance

#### Biking Widget
- **Data Source**: Strava API
- **Metrics Displayed**:
  - Distance (imperial units - miles)
  - Elevation gain (imperial units - feet)
  - Duration
  - Route map
- **Display**: Last ride information
- When active: Chat can answer questions related to Jeremy's past bike rides (data from Strava API)

#### Photos Gallery Widget
- **Features**:
  - Grid layout of photos
  - Click to enlarge (lightbox view)
  - No captions in lightbox
  - Full-screen photo viewing
- When active: Chat discusses photography, travel, memories from photos

#### Books Widget
- **Data Source**: Hardcover API
- **Display**: Currently reading books
- **Information**: Book titles, authors, reading progress (if available)
- When active: Chat can answer questions related to Jeremy's past reading (data from Hardcover API)

### 2. Contextual Chat System

#### Behavior
- Chat context changes based on active widget
- No page scrolling when clicking widgets or switching chat context
- Visual indicator in chat header showing which widget is active
- Persistent chat interface (doesn't close when switching widgets)

#### Visual States
- **Active Widget Indicator**: Display in chat header
- **Widget Selection**: Visual border/highlight on active widget
- **Context Switching**: Smooth transitions between topics

#### AI Integration
- **Provider**: Anthropic
- **Setup**: https://console.anthropic.com/
- **Authentication**: API Key
- **Model**: Claude 3.5 Sonnet (or latest)
- **Purpose**: Powers the contextual chat system
- **Features**:
  - Tool use for context-specific responses
  - Markdown file reference (About Me)
  - API integration tools (Spotify, Strava, Hardcover)
  - Natural language conversation
  - Context switching based on active widget

#### Chat Tools

##### Simple Reference Tools
- **About Me Tool**: References a markdown file (`/data/about-me.md`) containing personal information
  - Bio, background, career history, interests, projects
  - Chat uses this to answer questions about Jeremy's background and experience

##### API-Integrated Tools
- **Biking Tool**: Queries Strava API to answer cycling-related questions
  - Example: "What was Jeremy's longest bike ride?"
  - Example: "How much elevation did Jeremy climb last week?"
  - Accesses historical ride data, statistics, and performance metrics
  
- **Books Tool**: Queries Hardcover API to answer reading-related questions
  - Example: "What books has Jeremy read recently?"
  - Example: "What's Jeremy currently reading?"
  - Accesses reading history, current reads, and book ratings

- **Music Tool**: Queries Spotify API to answer music-related questions
  - Example: "What's Jeremy's most played song this month?"
  - Example: "What genre does Jeremy listen to most?"
  - Accesses listening history and preferences

##### Conversation Features
- Context-aware responses based on active widget
- Natural language understanding for varied question formats
- Ability to cross-reference data (e.g., "Show me bike rides from when I was listening to this album")
- Graceful handling when data isn't available

### 3. Drag and Drop System
- **Library**: `react-dnd`
- **Features**:
  - All widgets can be dragged and rearranged
  - Grid-based or masonry-style layout
  - Persistent layout (positions remembered)
  - Smooth animations during drag operations

### 4. Theme System

#### Clean & Minimal
- Light/neutral color palette
- Ample whitespace
- Simple typography
- Subtle shadows and borders
- Modern, professional aesthetic

## Technical Stack

### Core Technologies
- **Framework**: React
- **Styling**: Tailwind CSS v4.0
- **Animations**: Motion (motion/react)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Drag and Drop**: react-dnd

### API Integrations

#### Claude API
- **Provider**: Anthropic
- **Setup**: https://console.anthropic.com/
- **Authentication**: API Key
- **Model**: Claude 3.5 Sonnet (or latest)
- **Purpose**: Powers the contextual chat system
- **Features**:
  - Tool use for context-specific responses
  - Markdown file reference (About Me)
  - API integration tools (Spotify, Strava, Hardcover)
  - Natural language conversation
  - Context switching based on active widget

#### Spotify API
- **Setup**: https://developer.spotify.com/dashboard
- **Authentication**: OAuth 2.0
- **Required Scopes**: 
  - `user-read-recently-played`
  - `user-top-read`
- **Endpoints Used**:
  - Recently Played Tracks
  - Top Tracks (long-term)

#### Strava API
- **Metrics**: Distance, elevation, duration, route map
- **Units**: Imperial (miles, feet)
- **Data**: Last ride information

#### Hardcover API
- **Data**: Currently reading books
- **Display**: Titles, authors, progress

### File Structure
```
/
├── App.tsx                    # Main component
├── components/
│   ├── AboutWidget.tsx
│   ├── MusicWidget.tsx
│   ├── SnowboardingWidget.tsx
│   ├── BikingWidget.tsx
│   ├── PhotosWidget.tsx
│   ├── BooksWidget.tsx
│   ├── ChatSystem.tsx
│   └── [other components]
├── styles/
│   └── globals.css
└── spec.md                    # This file
```

## UI/UX Requirements

### Responsive Design
- Desktop-first approach
- Mobile responsive layouts
- Touch-friendly drag and drop on mobile
- Appropriate widget sizing for different screen sizes

### Accessibility
- Keyboard navigation support
- ARIA labels where appropriate
- Focus states for interactive elements
- Screen reader friendly

### Performance
- Lazy loading for images in photo gallery
- Efficient API calls with caching where appropriate
- Smooth animations (60fps target)
- Loading states for async operations

## Future Enhancements
- [ ] Widget layout persistence (save to localStorage or backend)
- [ ] Custom widget creation
- [ ] Additional theme options
- [ ] Chat AI integration for actual conversations
- [ ] Social media integrations
- [ ] Analytics dashboard widget
- [ ] Weather widget
- [ ] Calendar integration

## Development Notes

### API Configuration
All API integrations should:
- Use placeholder tokens by default with clear setup instructions
- Include mock/fallback data for development
- Handle errors gracefully
- Show loading states
- Include comments explaining setup process

### Styling Guidelines
- Use Tailwind classes (avoid custom CSS where possible)
- Do NOT use font size, weight, or line-height classes unless specifically requested
- Dark mode support for all themes
- Consistent spacing and sizing
- Custom scrollbar styling where needed

### State Management
- Widget active states
- Theme selection
- Drag and drop positions
- API data caching
- Loading and error states

## Testing Checklist
- [ ] All widgets render correctly
- [ ] Drag and drop works smoothly
- [ ] Chat context switches properly
- [ ] Theme switching updates all components
- [ ] API integrations work with real credentials
- [ ] Fallback data displays when APIs fail
- [ ] Mobile responsive
- [ ] Dark mode works across all themes
- [ ] Loading states display correctly
- [ ] Error handling works as expected