/**
 * Simple API key authentication for personal use
 * No complex user management needed - just a single API key
 */

export function requireAuth(): string {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API_KEY environment variable must be configured');
  }

  if (apiKey.length < 20) {
    throw new Error('API_KEY must be at least 20 characters for security');
  }

  return apiKey;
}

export function validateApiKey(providedKey: string | null): boolean {
  if (!providedKey) {
    return false;
  }

  try {
    const validKey = requireAuth();
    return providedKey === validKey;
  } catch {
    return false;
  }
}
