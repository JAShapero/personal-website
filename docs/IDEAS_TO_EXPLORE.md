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

### 2. Add LLM Debug/Details Toggle to Chat
- **Goal**: Add a toggle that reveals technical details about what's happening behind the scenes with the LLM during chat interactions
- **Features to Display**:
  - **Request Details**: Show what messages are being sent to the LLM API each time
    - System prompts
    - User messages
    - Conversation history
    - Message structure and formatting
  - **Reasoning/Planning**: Expose any planning or reasoning steps that the LLM is performing
    - Internal thought processes
    - Step-by-step reasoning (if available from the API)
    - Decision-making logic
  - **Streaming Information**: Display what tokens are being received as they stream in
    - Real-time token display
    - Token-by-token streaming visualization
    - Completion status
  - **Token Usage**: Show total token counts for each request
    - Input tokens (prompt + context)
    - Output tokens (response)
    - Total tokens per request
    - Cumulative token usage for the session
  - **Tool/API Usage**: Display what tools and APIs are being used
    - Which tools are being called
    - API endpoints being hit
    - Function calls and their parameters
    - Tool execution results
- **Design Ideas**:
  - Toggle button/switch in the chat interface (e.g., "Show Details" or "Debug Mode")
  - Expandable panel or sidebar that shows technical information
  - Color-coded sections for different types of information
  - Collapsible sections for each request/response cycle
  - JSON viewer for structured data
  - Token counter with visual indicators
  - Timeline view showing the sequence of API calls
- **Implementation**:
  - Add toggle state to `ChatPanel.tsx`
  - Modify `api/chat.ts` to capture and return debug information
  - Create a debug/details panel component
  - Display request/response data in a readable format
  - Track token usage from API responses
  - Log tool calls and API usage
  - Consider using a library like `react-json-view` for JSON display
  - Add copy-to-clipboard functionality for debugging

---

## Widgets

### 3. Add "About the Site" Widget
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

