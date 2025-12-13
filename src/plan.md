# Development Plan: Personal Website Build

## Current State
- ✅ Music widget implemented with Spotify API integration (mock data)
- ✅ Spec document created with comprehensive requirements
- ✅ Data files created (about-me.md, photos.md, snowboarding.csv)
- ✅ Basic understanding of all widget requirements

## Build Phases

---

## Phase 1: Foundation & Layout Setup
**Goal**: Establish core app structure and basic layout system

### Tasks
- [ ] Review current `/App.tsx` structure
- [ ] Set up main layout container for widgets
- [ ] Implement basic grid/masonry layout structure
- [ ] Add dark mode toggle functionality
- [ ] Verify Tailwind configuration is working properly
- [ ] Create widget container wrapper component (if needed)

**Estimated Time**: 1-2 hours

---

## Phase 2: Widget Development
**Goal**: Build all 6 widgets with static/mock data first

### 2.1 About Me Widget
- [ ] Create `/components/AboutWidget.tsx`
- [ ] Design layout for bio display
- [ ] Add icon and styling consistent with Music widget
- [ ] Test responsive behavior
- [ ] Add active/inactive states

### 2.2 Snowboarding Widget
- [ ] Create `/components/SnowboardingWidget.tsx`
- [ ] Parse CSV data from `/data/snowboarding.csv`
- [ ] Implement line chart using Recharts
- [ ] Show both 2022-23 and 2023-24 seasons
- [ ] Add legend and axis labels
- [ ] Style chart to match overall design
- [ ] Add active/inactive states

### 2.3 Biking Widget
- [ ] Create `/components/BikingWidget.tsx`
- [ ] Design layout for metrics (distance, elevation, duration)
- [ ] Add placeholder for route map
- [ ] Use mock data initially (imperial units)
- [ ] Add Strava icon/branding
- [ ] Add active/inactive states

### 2.4 Photos Widget
- [ ] Create `/components/PhotosWidget.tsx`
- [ ] Implement grid layout for photo thumbnails
- [ ] Use Unsplash tool to get placeholder images
- [ ] Create lightbox component for full-screen view
- [ ] Implement click to enlarge (no captions)
- [ ] Add close button and keyboard navigation (ESC)
- [ ] Test with 12 photos from photos.md metadata
- [ ] Add active/inactive states

### 2.5 Books Widget
- [ ] Create `/components/BooksWidget.tsx`
- [ ] Design layout for book cards/list
- [ ] Use mock book data initially
- [ ] Display: title, author, cover image (Unsplash placeholders)
- [ ] Add reading progress indicator if applicable
- [ ] Add active/inactive states

### 2.6 Music Widget Enhancement
- [ ] Review current implementation
- [ ] Ensure it matches design system of other widgets
- [ ] Verify scrolling works properly
- [ ] Test toggle between views

**Estimated Time**: 4-6 hours

---

## Phase 3: Drag and Drop System
**Goal**: Make all widgets draggable and rearrangeable

### Tasks
- [ ] Install and configure `react-dnd` package
- [ ] Create DraggableWidget wrapper component
- [ ] Implement drag source for all widgets
- [ ] Implement drop target zones
- [ ] Add visual feedback during drag (opacity, cursor)
- [ ] Implement position state management
- [ ] Add smooth animations for reordering
- [ ] Save layout positions to localStorage
- [ ] Restore layout on page load
- [ ] Test on desktop
- [ ] Test touch drag on mobile/tablet

**Estimated Time**: 3-4 hours

---

## Phase 4: Chat System Foundation
**Goal**: Build chat UI and context switching logic

### 4.1 Chat UI
- [ ] Create `/components/ChatSystem.tsx`
- [ ] Design chat interface (sidebar or modal)
- [ ] Add chat header with active widget indicator
- [ ] Create message list component
- [ ] Create message input component
- [ ] Add send button and keyboard shortcuts (Enter to send)
- [ ] Style chat to match overall design
- [ ] Add open/close animation
- [ ] Add scrolling behavior for message history

### 4.2 Context Switching
- [ ] Implement active widget tracking in App.tsx
- [ ] Pass active widget state to ChatSystem
- [ ] Update chat header indicator when widget changes
- [ ] Add visual border/highlight to active widget
- [ ] Ensure no page scrolling on widget click
- [ ] Test smooth transitions between widget contexts

### 4.3 Mock Chat Responses
- [ ] Create simple response logic for each widget type
- [ ] Add loading state for "typing" indicator
- [ ] Display mock responses based on active widget
- [ ] Test conversation flow

**Estimated Time**: 4-5 hours

---

## Phase 5: API Integrations
**Goal**: Connect real APIs to widgets and chat system

### 5.1 API Setup Documentation
- [ ] Create `/docs/api-setup.md` with detailed instructions
- [ ] Document Spotify OAuth setup process
- [ ] Document Strava API setup process
- [ ] Document Hardcover API setup process
- [ ] Document Claude API setup process
- [ ] Create `.env.example` file with all required keys

### 5.2 Spotify API Integration
- [ ] Set up OAuth flow or use access token method
- [ ] Connect Recently Played endpoint to Music widget
- [ ] Connect Top Tracks endpoint to Music widget
- [ ] Add error handling and retry logic
- [ ] Test with real credentials
- [ ] Ensure fallback to mock data works

### 5.3 Strava API Integration
- [ ] Set up Strava API credentials
- [ ] Implement endpoint for last ride data
- [ ] Convert metrics to imperial units
- [ ] Add route map integration (static map or embed)
- [ ] Connect to Biking widget
- [ ] Test with real credentials
- [ ] Ensure fallback to mock data works

### 5.4 Hardcover API Integration
- [ ] Research Hardcover API documentation
- [ ] Set up API credentials
- [ ] Implement endpoint for currently reading books
- [ ] Fetch book covers and metadata
- [ ] Connect to Books widget
- [ ] Test with real credentials
- [ ] Ensure fallback to mock data works

### 5.5 Claude API Integration
- [ ] Set up Anthropic API key
- [ ] Create backend endpoint (or serverless function) for Claude API calls
- [ ] Implement tool definitions for chat system
- [ ] Create About Me tool (reads from `/data/about-me.md`)
- [ ] Create Biking tool (queries Strava API)
- [ ] Create Books tool (queries Hardcover API)
- [ ] Create Music tool (queries Spotify API)
- [ ] Create Photos tool (references `/data/photos.md`)
- [ ] Create Snowboarding tool (references `/data/snowboarding.csv`)
- [ ] Implement context switching in prompts
- [ ] Add conversation history management
- [ ] Connect to ChatSystem component
- [ ] Test tool use with different questions
- [ ] Add error handling and fallbacks

**Estimated Time**: 8-12 hours


---

## Phase 6: Polish & Optimization
**Goal**: Refine UX, fix bugs, optimize performance

### 6.1 UX Enhancements
- [ ] Add loading skeletons for widgets
- [ ] Improve error messages (user-friendly)
- [ ] Add tooltips where helpful
- [ ] Ensure all interactions have feedback
- [ ] Add transitions/animations where missing
- [ ] Test keyboard navigation throughout site
- [ ] Add focus states for accessibility

### 6.2 Performance
- [ ] Lazy load images in photo gallery
- [ ] Optimize API calls (caching, debouncing)
- [ ] Code split components if needed
- [ ] Test animation performance (60fps)
- [ ] Optimize bundle size

### 6.3 Responsive Design
- [ ] Test on mobile (portrait and landscape)
- [ ] Test on tablet
- [ ] Test on desktop (various sizes)
- [ ] Adjust widget sizes for different screens
- [ ] Test drag and drop on touch devices
- [ ] Ensure chat works well on mobile

### 6.4 Browser Testing
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Fix any browser-specific issues


**Estimated Time**: 4-6 hours

---

## Phase 7: Documentation & Deployment
**Goal**: Document the project and prepare for deployment

### 7.1 Documentation
- [ ] Update README.md with project overview
- [ ] Document how to run locally
- [ ] Document environment variables needed
- [ ] Add screenshots/demo GIF
- [ ] Document API setup process
- [ ] Add troubleshooting section

### 7.2 Deployment Preparation
- [ ] Choose hosting platform (Vercel, Netlify, etc.)
- [ ] Set up environment variables in hosting platform
- [ ] Configure build settings
- [ ] Test production build locally

### 7.3 Deploy
- [ ] Deploy to staging environment
- [ ] Test all features in staging
- [ ] Fix any deployment-specific issues
- [ ] Deploy to production
- [ ] Verify production works correctly
- [ ] Set up custom domain (if applicable)

**Estimated Time**: 2-3 hours


---

## Priority Order (MVP First Approach)

If you want to build an MVP quickly, tackle in this order:

1. **Phase 2**: Build all widgets with mock data (6 hours)
2. **Phase 1**: Set up layout properly (2 hours)
3. **Phase 4**: Basic chat UI with mock responses (5 hours)
4. **Phase 3**: Add drag and drop (4 hours)
5. **Phase 5**: API integrations (can be done incrementally)

---

## Notes

### Dependencies
- Some tasks are sequential (e.g., must build widgets before adding drag and drop)
- API integrations can be done in parallel with other work
- Themes can be added at any point after widgets are built

### Testing Strategy
- Test each widget individually before integration
- Test drag and drop thoroughly on multiple devices
- Test chat system with various question types
- Test all themes with all widgets

### Risk Areas
- **Claude API Integration**: Most complex part, may need backend/serverless functions
- **Strava API**: OAuth flow might be tricky
- **Drag and Drop Mobile**: Touch events can be finicky
- **Performance**: Many widgets with API calls could slow things down

### Success Criteria
- [ ] All 6 widgets display correctly
- [ ] Widgets are draggable and positions persist
- [ ] Chat responds contextually based on active widget
- [ ] All APIs work with real data
- [ ] Three themes fully functional
- [ ] Site is responsive and accessible
- [ ] Performance is smooth (60fps animations)
