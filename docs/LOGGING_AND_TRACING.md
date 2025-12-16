# Logging and Tracing Guide for Chat Feature

This guide covers the best approaches for logging and reviewing traces from the chat feature.

## Overview

The chat feature makes multiple API calls, uses tool/function calling, handles streaming responses, and integrates with external APIs. Proper logging helps you:

- Debug issues and errors
- Monitor API costs and usage
- Understand user interactions
- Track tool usage patterns
- Analyze response quality
- Optimize performance

## Recommended Solutions

### Option 1: LangSmith (Recommended for AI/LLM Applications) ⭐

**Best for**: LLM tracing, tool usage, token tracking, cost analysis

LangSmith is made by Anthropic (the company behind Claude) and is specifically designed for tracing LLM applications. It provides:

- **Full request/response traces** with token counts
- **Tool call visualization** - see which tools were called and their results
- **Cost tracking** - monitor API costs per request
- **Latency metrics** - response times for each step
- **Error tracking** - automatic error capture
- **Search and filtering** - find specific conversations or patterns

#### Setup Steps

1. **Sign up for LangSmith**
   - Go to https://smith.langchain.com/
   - Sign up with your Anthropic account (or create one)
   - Create a new project (e.g., "Personal Website Chat")

2. **Get your API key**
   - Go to Settings → API Keys
   - Create a new API key
   - Copy the key

3. **Add to Vercel Environment Variables**
   - `LANGCHAIN_API_KEY` - Your LangSmith API key
   - `LANGCHAIN_PROJECT` - Your project name (optional, defaults to "default")
   - `LANGCHAIN_TRACING_V2` - Set to `"true"`

4. **Install the SDK**
   ```bash
   npm install @langchain/core
   ```

5. **Update chat.ts** - See implementation below

#### Benefits
- ✅ Purpose-built for LLM applications
- ✅ Automatic tracing of Claude API calls
- ✅ Beautiful UI for reviewing traces
- ✅ Free tier available
- ✅ Token usage and cost tracking
- ✅ Tool call visualization

#### Pricing
- Free tier: 1,000 traces/month
- Paid plans start at $39/month

---

### Option 2: Structured Logging with Vercel Logs

**Best for**: Simple setup, no additional services, basic monitoring

Vercel provides built-in logging that you can view in the dashboard. Improve your current logging by:

1. **Structuring logs** with consistent format
2. **Adding request IDs** for traceability
3. **Logging key events** (requests, responses, errors, tool calls)
4. **Using log levels** (info, warn, error)

#### Viewing Logs
- Go to your Vercel project dashboard
- Click on "Functions" tab
- Click on a function (e.g., `/api/chat`)
- View real-time logs and search/filter

#### Benefits
- ✅ No additional setup required
- ✅ Already available in Vercel dashboard
- ✅ Free
- ❌ Limited search/filter capabilities
- ❌ No cost tracking
- ❌ Basic visualization

---

### Option 3: Third-Party Logging Services

**Best for**: Advanced features, team collaboration, long-term retention

Options:
- **Logtail** (formerly Timber) - Simple, fast, good search
- **Axiom** - Great for Vercel, good free tier
- **Better Stack** - Modern UI, good alerting
- **Datadog** - Enterprise-grade, more expensive

#### Benefits
- ✅ Advanced search and filtering
- ✅ Long-term log retention
- ✅ Alerting and monitoring
- ✅ Team collaboration
- ❌ Additional service to manage
- ❌ May have costs

---

## Implementation: LangSmith (Recommended)

Here's how to implement LangSmith tracing in your chat feature:

### Step 1: Install Dependencies

```bash
npm install @langchain/core
```

### Step 2: Update `api/chat.ts`

Add LangSmith tracing to your Anthropic SDK calls. The SDK automatically sends traces to LangSmith when environment variables are set.

### Step 3: Add Structured Logging Helper

Create a logging utility that works alongside LangSmith:

```typescript
// api/logger.ts
interface LogContext {
  requestId?: string;
  userId?: string;
  activeWidget?: string;
  [key: string]: any;
}

export function logInfo(message: string, context?: LogContext) {
  console.log(JSON.stringify({
    level: 'info',
    message,
    timestamp: new Date().toISOString(),
    ...context
  }));
}

export function logError(message: string, error: any, context?: LogContext) {
  console.error(JSON.stringify({
    level: 'error',
    message,
    error: {
      message: error?.message,
      stack: error?.stack,
      status: error?.status,
    },
    timestamp: new Date().toISOString(),
    ...context
  }));
}

export function logToolCall(toolName: string, input: any, result: any, context?: LogContext) {
  console.log(JSON.stringify({
    level: 'info',
    type: 'tool_call',
    tool: toolName,
    input,
    result: typeof result === 'string' ? result.substring(0, 500) : result, // Truncate long results
    timestamp: new Date().toISOString(),
    ...context
  }));
}
```

### Step 4: Review Traces in LangSmith

1. Go to https://smith.langchain.com/
2. Navigate to your project
3. View traces in real-time or search by:
   - Date range
   - User query
   - Tool used
   - Error status
   - Cost range
4. Click on any trace to see:
   - Full conversation flow
   - Tool calls and results
   - Token usage (input/output)
   - Latency breakdown
   - Cost per request

---

## What to Log

### Essential Events

1. **Request Received**
   - User message
   - Active widget
   - Conversation history length
   - Request ID (for traceability)

2. **Claude API Calls**
   - Request payload (messages, tools)
   - Response (content, tool calls)
   - Token usage (input/output)
   - Latency
   - Model used

3. **Tool Calls**
   - Tool name
   - Input parameters
   - Result (truncated if large)
   - Execution time
   - Success/failure

4. **External API Calls**
   - Spotify/Strava/Hardcover calls
   - Response status
   - Latency
   - Errors

5. **Streaming Events**
   - Planning events
   - Response chunks
   - Completion status

6. **Errors**
   - Error type
   - Error message
   - Stack trace
   - Context (request ID, user message, etc.)

7. **Performance Metrics**
   - Total request time
   - Time to first token (streaming)
   - Tool execution time
   - API call latency

---

## Example Trace Review Workflow

### Daily Review
1. Check LangSmith dashboard for errors
2. Review high-cost requests
3. Check average latency trends

### Debugging an Issue
1. Search for error messages or request IDs
2. View full trace to see:
   - What tools were called
   - What data was returned
   - Where it failed
3. Compare with successful similar requests

### Cost Optimization
1. Review token usage per request
2. Identify expensive tool calls
3. Optimize prompts to reduce tokens
4. Cache frequently accessed data

### User Experience Analysis
1. Review common queries
2. Check tool usage patterns
3. Identify slow responses
4. Find confusing responses

---

## Quick Start: Minimal Implementation

If you want to start simple, just improve your existing console.log statements:

```typescript
// Add request ID to each request
const requestId = crypto.randomUUID();

// Log structured data
console.log(JSON.stringify({
  type: 'chat_request',
  requestId,
  activeWidget,
  messageCount: messages.length,
  timestamp: new Date().toISOString()
}));

// Log tool calls
console.log(JSON.stringify({
  type: 'tool_call',
  requestId,
  tool: toolCall.name,
  input: toolCall.input,
  timestamp: new Date().toISOString()
}));
```

Then view logs in Vercel dashboard with better structure.

---

## Next Steps

1. **Choose your approach** (LangSmith recommended)
2. **Set up environment variables**
3. **Implement logging** (see implementation guide)
4. **Test locally** with `vercel dev`
5. **Review traces** in your chosen tool
6. **Set up alerts** for errors or high costs

---

## Additional Resources

- [LangSmith Documentation](https://docs.smith.langchain.com/)
- [Vercel Logs Documentation](https://vercel.com/docs/observability/logs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
