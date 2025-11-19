/**
 * Memory-based rate limiting for API routes
 * No external dependencies required - perfect for personal use
 */

const requests = new Map<string, number[]>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if an identifier has exceeded the rate limit
 * @param identifier - Unique identifier (IP address, API key, etc.)
 * @param limit - Maximum requests allowed in the window (default: 10)
 * @param windowMs - Time window in milliseconds (default: 10000 = 10 seconds)
 * @returns Rate limit result with success status and metadata
 */
export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 10000
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get existing requests for this identifier
  const userRequests = requests.get(identifier) || [];

  // Filter out old requests outside the current window
  const recentRequests = userRequests.filter(time => time > windowStart);

  // Calculate remaining requests
  const remaining = Math.max(0, limit - recentRequests.length);
  const resetAt = now + windowMs;

  // Check if limit exceeded
  if (recentRequests.length >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt,
    };
  }

  // Add current request timestamp
  recentRequests.push(now);
  requests.set(identifier, recentRequests);

  // Periodic cleanup of old entries (1% chance on each call)
  // This prevents memory leaks from inactive identifiers
  if (Math.random() < 0.01) {
    cleanupOldEntries(windowStart);
  }

  return {
    success: true,
    remaining: remaining - 1, // Subtract 1 for the current request
    resetAt,
  };
}

/**
 * Cleanup old entries to prevent memory leaks
 * Called periodically by rateLimit()
 */
function cleanupOldEntries(windowStart: number): void {
  for (const [key, times] of requests.entries()) {
    // Remove entries where all timestamps are outside the current window
    if (times.every(t => t < windowStart)) {
      requests.delete(key);
    }
  }
}

/**
 * Clear all rate limit data (useful for testing)
 */
export function clearRateLimits(): void {
  requests.clear();
}

/**
 * Get rate limit stats for debugging
 */
export function getRateLimitStats(): {
  totalIdentifiers: number;
  totalRequests: number;
} {
  let totalRequests = 0;
  for (const times of requests.values()) {
    totalRequests += times.length;
  }

  return {
    totalIdentifiers: requests.size,
    totalRequests,
  };
}
