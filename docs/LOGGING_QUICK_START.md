# Logging Quick Start

This guide shows you how to quickly start logging and reviewing traces from the chat feature.

## What's Been Set Up

✅ **Structured logging** - All logs are now JSON-formatted for easy parsing  
✅ **Request tracing** - Each request gets a unique ID for tracking  
✅ **Tool call logging** - Track which tools are called and their results  
✅ **Performance metrics** - Monitor response times and API call durations  
✅ **Error tracking** - Comprehensive error logging with context  

## Viewing Logs

### Option 1: Vercel Dashboard (Immediate - No Setup)

1. Go to your Vercel project dashboard
2. Click on **Functions** tab
3. Click on `/api/chat` function
4. View real-time logs

**Search tips:**
- Search for `"requestId": "req_..."` to find a specific request
- Search for `"type": "tool_call"` to see all tool calls
- Search for `"level": "error"` to find errors
- Search for `"type": "performance"` to see timing metrics

### Option 2: LangSmith (Recommended for AI Tracing)

**Setup (5 minutes):**

1. Sign up at https://smith.langchain.com/
2. Create a project (e.g., "Personal Website Chat")
3. Get your API key from Settings → API Keys
4. Add to Vercel environment variables:
   - `LANGCHAIN_API_KEY` = your API key
   - `LANGCHAIN_TRACING_V2` = `"true"`
   - `LANGCHAIN_PROJECT` = your project name (optional)
5. Redeploy your site

**Benefits:**
- Automatic tracing of Claude API calls
- Token usage and cost tracking
- Beautiful visualization of tool calls
- Search and filter by date, query, tool, etc.

## What Gets Logged

### Every Request
- Request ID (for tracing)
- Active widget
- Message count
- Conversation history length
- Streaming mode

### Claude API Calls
- Request details (message count, tools available)
- Response details (text length, tool calls made)
- Duration
- Errors (with full context)

### Tool Calls
- Tool name
- Input parameters
- Result (truncated if large)
- Execution time
- Errors (if any)

### Performance Metrics
- Total request duration
- API call duration
- Tool execution duration

### Streaming Events
- Planning events
- Response events
- Completion events

## Example Log Entries

### Request Received
```json
{
  "level": "info",
  "message": "Chat request received",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_1705315800000_abc123",
  "activeWidget": "music",
  "messageCount": 1,
  "conversationHistoryLength": 2,
  "useStreaming": true
}
```

### Tool Call
```json
{
  "level": "info",
  "type": "tool_call",
  "tool": "get_music_data",
  "input": { "query": "recent_tracks" },
  "result": "Recently played tracks:\n1. \"Song Name\" by Artist...",
  "duration": 245,
  "timestamp": "2024-01-15T10:30:01.000Z",
  "requestId": "req_1705315800000_abc123",
  "activeWidget": "music"
}
```

### Performance Metrics
```json
{
  "level": "info",
  "type": "performance",
  "metrics": {
    "totalDuration": 1250,
    "apiCallDuration": 450,
    "toolExecutionDuration": 800
  },
  "timestamp": "2024-01-15T10:30:02.000Z",
  "requestId": "req_1705315800000_abc123",
  "activeWidget": "music"
}
```

## Common Tasks

### Find a Specific Conversation
1. In Vercel logs, search for a unique phrase from the user's message
2. Note the `requestId` from the log
3. Search for that `requestId` to see all related logs

### Debug a Failed Tool Call
1. Search for `"type": "tool_error"`
2. Review the error message and stack trace
3. Check the tool input to see what parameters were used
4. Look at the request context to understand the full conversation

### Monitor API Costs
1. If using LangSmith, go to the dashboard
2. View token usage per request
3. Check cost trends over time
4. Identify expensive queries

### Analyze Tool Usage Patterns
1. Search for `"type": "tool_call"`
2. Count occurrences of each tool name
3. Review which tools are used most often
4. Check tool execution times

## Tips

1. **Use request IDs** - Every log entry includes a `requestId` for easy tracing
2. **Filter by type** - Search for specific log types (`tool_call`, `error`, `performance`)
3. **Check timestamps** - All logs include ISO timestamps
4. **Review performance** - Look for slow requests in performance logs
5. **Monitor errors** - Set up alerts for error-level logs

## Next Steps

- Set up LangSmith for advanced AI tracing (recommended)
- Configure log retention in Vercel (if needed)
- Set up alerts for errors or high latency
- Review logs regularly to optimize performance

## Troubleshooting

**No logs appearing?**
- Make sure you're looking at the correct function (`/api/chat`)
- Check that the function is being called (test the chat feature)
- Verify you're looking at the correct environment (production vs preview)

**Can't find a specific request?**
- Use the request ID from any log entry
- Search for unique text from the user's message
- Check the timestamp to narrow down the time range

**Logs too verbose?**
- The logger is designed to be comprehensive
- You can filter logs by type in your log viewer
- Consider using LangSmith for better filtering and visualization
