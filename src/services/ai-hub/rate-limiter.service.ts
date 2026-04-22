/**
 * Rate Limiter Service
 * Tracks and limits API calls per user/IP
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limits (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const MESSAGES_PER_DAY = 25;
const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get client identifier (IP address or session ID)
 */
export function getClientIdentifier(req: any): string {
  // Try to get IP from various headers (for proxies)
  const ip = 
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    'unknown';
  
  return ip;
}

/**
 * Check if client has exceeded rate limit
 */
export function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);

  if (!entry) {
    // First request from this client
    return false;
  }

  // Check if reset interval has passed
  if (now > entry.resetTime) {
    // Reset the counter
    rateLimitStore.delete(clientId);
    return false;
  }

  // Check if limit exceeded
  return entry.count >= MESSAGES_PER_DAY;
}

/**
 * Increment request count for client
 */
export function incrementRequestCount(clientId: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(clientId);

  if (!entry) {
    // First request
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + RESET_INTERVAL,
    });
  } else if (now > entry.resetTime) {
    // Reset interval passed, start new counter
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + RESET_INTERVAL,
    });
  } else {
    // Increment existing counter
    entry.count++;
  }
}

/**
 * Get remaining requests for client
 */
export function getRemainingRequests(clientId: string): number {
  const entry = rateLimitStore.get(clientId);

  if (!entry) {
    return MESSAGES_PER_DAY;
  }

  const now = Date.now();
  if (now > entry.resetTime) {
    return MESSAGES_PER_DAY;
  }

  return Math.max(0, MESSAGES_PER_DAY - entry.count);
}

/**
 * Get reset time for client
 */
export function getResetTime(clientId: string): number {
  const entry = rateLimitStore.get(clientId);

  if (!entry) {
    return Date.now();
  }

  return entry.resetTime;
}

/**
 * Clear all rate limit data (for testing)
 */
export function clearAllLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get all rate limit entries (for debugging)
 */
export function getAllLimits(): Map<string, RateLimitEntry> {
  return new Map(rateLimitStore);
}
