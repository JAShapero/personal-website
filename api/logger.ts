/**
 * Structured logging utility for chat API
 * 
 * Logs are structured as JSON for easy parsing and searching.
 * Works with Vercel logs and can be integrated with external logging services.
 */

interface LogContext {
  requestId?: string;
  userId?: string;
  activeWidget?: string;
  [key: string]: any;
}

interface ToolCallLog {
  tool: string;
  input: any;
  result?: any;
  duration?: number;
  error?: string;
}

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Log an info-level message
 */
export function logInfo(message: string, context?: LogContext) {
  console.log(JSON.stringify({
    level: 'info',
    message,
    timestamp: new Date().toISOString(),
    ...context
  }));
}

/**
 * Log an error with full context
 */
export function logError(message: string, error: any, context?: LogContext) {
  console.error(JSON.stringify({
    level: 'error',
    message,
    error: {
      message: error?.message,
      stack: error?.stack,
      status: error?.status,
      code: error?.code,
    },
    timestamp: new Date().toISOString(),
    ...context
  }));
}

/**
 * Log a tool call with input and result
 */
export function logToolCall(toolName: string, input: any, result?: any, duration?: number, context?: LogContext) {
  const log: ToolCallLog = {
    tool: toolName,
    input,
    ...(result !== undefined && { result: typeof result === 'string' ? truncate(result, 1000) : result }),
    ...(duration !== undefined && { duration }),
  };

  console.log(JSON.stringify({
    level: 'info',
    type: 'tool_call',
    ...log,
    timestamp: new Date().toISOString(),
    ...context
  }));
}

/**
 * Log a tool call error
 */
export function logToolError(toolName: string, input: any, error: any, context?: LogContext) {
  console.error(JSON.stringify({
    level: 'error',
    type: 'tool_error',
    tool: toolName,
    input,
    error: {
      message: error?.message,
      stack: error?.stack,
    },
    timestamp: new Date().toISOString(),
    ...context
  }));
}

/**
 * Log a Claude API request
 */
export function logClaudeRequest(messages: any[], tools?: any[], context?: LogContext) {
  console.log(JSON.stringify({
    level: 'info',
    type: 'claude_request',
    messageCount: messages.length,
    hasTools: !!tools && tools.length > 0,
    toolCount: tools?.length || 0,
    timestamp: new Date().toISOString(),
    ...context
  }));
}

/**
 * Log a Claude API response
 */
export function logClaudeResponse(response: any, duration?: number, context?: LogContext) {
  const toolCalls = response.content?.filter((item: any) => item.type === 'tool_use') || [];
  const textContent = response.content?.find((item: any) => item.type === 'text');
  
  console.log(JSON.stringify({
    level: 'info',
    type: 'claude_response',
    hasText: !!textContent,
    textLength: textContent?.text?.length || 0,
    toolCallCount: toolCalls.length,
    tools: toolCalls.map((tc: any) => tc.name),
    ...(duration !== undefined && { duration }),
    timestamp: new Date().toISOString(),
    ...context
  }));
}

/**
 * Log streaming events
 */
export function logStreamEvent(eventType: string, data: any, context?: LogContext) {
  console.log(JSON.stringify({
    level: 'info',
    type: 'stream_event',
    event: eventType,
    data: typeof data === 'string' ? truncate(data, 500) : data,
    timestamp: new Date().toISOString(),
    ...context
  }));
}

/**
 * Log performance metrics
 */
export function logPerformance(metrics: {
  totalDuration?: number;
  apiCallDuration?: number;
  toolExecutionDuration?: number;
  streamingDuration?: number;
  [key: string]: number | undefined;
}, context?: LogContext) {
  console.log(JSON.stringify({
    level: 'info',
    type: 'performance',
    metrics,
    timestamp: new Date().toISOString(),
    ...context
  }));
}

/**
 * Truncate long strings for logging
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '... [truncated]';
}
