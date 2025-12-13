# Ideas to Explore

This document contains potential enhancements and features to consider for future development.

## Chat & AI

### 1. Make the Chat Sound Like Me / Tweak Personality
- **Goal**: Customize the chat AI's personality to match Jeremy's communication style
- **Approach**:
  - Analyze writing samples from Jeremy's content (blog posts, social media, etc.)
  - Create a personality profile or style guide
  - Update system prompts in `api/chat.ts` to reflect this personality
  - Add examples of Jeremy's communication style to the Claude system prompt
  - Consider tone: casual, technical, humorous, etc.
- **Implementation Ideas**:
  - Add personality parameters to the system prompt
  - Include example conversations that demonstrate the desired tone
  - Reference Jeremy's writing from `about-me.md` for style consistency
  - Consider allowing users to adjust personality sliders (formal/casual, technical/simple, etc.)

---

## Widgets

### 2. Add "About the Site" Widget
- **Goal**: Create a widget that shows the site's architecture and explains what technologies are being used and how
- **Features**:
  - Display tech stack visually (React, TypeScript, Tailwind, etc.)
  - Show architecture diagram or visual representation
  - Explain how different parts work together:
    - Frontend (React components, widgets)
    - Backend (Vercel serverless functions)
    - API integrations (Claude, Spotify, Strava, etc.)
    - Data flow and interactions
  - Interactive elements to explore different parts
- **Design Ideas**:
  - Tech stack badges/icons
  - Architecture diagram with clickable components
  - Code snippets showing key implementations
  - Explanation of design decisions
  - Link to GitHub repository
- **Implementation**:
  - Create `AboutSiteWidget.tsx` component
  - Include visual diagrams or interactive architecture explorer
  - Add to widget list in `App.tsx`
  - Consider using a library like `react-flow` for interactive diagrams

---

## Additional Ideas

*Add more ideas here as they come up...*

---

**Note**: These are exploration ideas - not all may be implemented. Use this as a brainstorming and prioritization document.

