/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Jitter factor to add randomness to delays (0-1, default: 0.1) */
  jitter?: number;
  /** Function to determine if an error should be retried */
  shouldRetry?: (error: any, attempt: number) => boolean;
}

/**
 * Default retry options
 */
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: 0.1,
  shouldRetry: (error: any) => {
    // Retry on network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }
    
    // Retry on specific HTTP status codes
    const status = error.status || error.response?.status;
    if (status) {
      // Retry on server errors (5xx) and rate limiting (429, 503)
      return status >= 500 || status === 429 || status === 503;
    }
    
    // Retry on other network-related errors
    return error.code === 'ECONNRESET' || 
           error.code === 'ETIMEDOUT' || 
           error.code === 'ENOTFOUND' ||
           error.message?.includes('timeout') ||
           error.message?.includes('network');
  },
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const exponentialDelay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, options.maxDelay);
  
  // Add jitter to prevent thundering herd
  const jitterAmount = cappedDelay * options.jitter * (Math.random() * 2 - 1);
  return Math.max(0, cappedDelay + jitterAmount);
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(async () => {
 *   const response = await fetch('https://api.example.com/data');
 *   if (!response.ok) {
 *     throw { status: response.status, response };
 *   }
 *   return response.json();
 * }, { maxRetries: 3 });
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts: Required<RetryOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
    shouldRetry: options.shouldRetry || DEFAULT_OPTIONS.shouldRetry,
  };

  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if we've exhausted all attempts
      if (attempt >= opts.maxRetries) {
        break;
      }
      
      // Check if we should retry this error
      if (!opts.shouldRetry(error, attempt + 1)) {
        throw error;
      }
      
      // Calculate delay and wait before retrying
      const delay = calculateDelay(attempt + 1, opts);
      console.log(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Retry a fetch request with exponential backoff
 * 
 * This is a convenience wrapper around retryWithBackoff specifically for fetch calls.
 * It automatically handles response errors and status codes.
 * 
 * @param url - The URL to fetch
 * @param init - Fetch options (RequestInit)
 * @param retryOptions - Retry configuration options
 * @returns The Response object
 * 
 * @example
 * ```typescript
 * const response = await fetchWithRetry('https://api.example.com/data', {
 *   headers: { 'Authorization': 'Bearer token' }
 * }, { maxRetries: 3 });
 * const data = await response.json();
 * ```
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, init);
    
    // Throw error for non-2xx responses so they can be retried if appropriate
    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }
    
    return response;
  }, retryOptions);
}

