/**
 * Global test setup for Vitest
 * Runs before all test files
 */

import { beforeAll, afterAll, beforeEach } from 'vitest';
import * as dotenv from 'dotenv';

// Load environment variables from .env.test if it exists, otherwise .env
dotenv.config({ path: '.env.test' });
dotenv.config();

// Set required environment variables for testing
process.env.API_KEY = process.env.API_KEY || 'test-api-key-1234567890123456789012345';
process.env.CRON_SECRET = process.env.CRON_SECRET || 'test-cron-secret';
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ||
  '4116a1023adb5a6d2c43562a4101f8221808959f60252740d6d1ceab02ded646'; // Valid test key
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Global test hooks
beforeAll(() => {
  console.log('>ê Test suite starting...');
});

afterAll(() => {
  console.log(' Test suite completed');
});

beforeEach(() => {
  // Clear any mocked modules between tests
  vi.clearAllMocks();
});
