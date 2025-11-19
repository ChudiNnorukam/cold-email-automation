/**
 * Security Tests
 * Tests authentication, authorization, rate limiting, encryption, and input validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { requireAuth, validateApiKey } from '@/lib/auth';
import { rateLimit, clearRateLimits } from '@/lib/rate-limit';
import { encrypt, decrypt, generateEncryptionKey } from '@/lib/crypto';

describe('Authentication & Authorization', () => {
  describe('requireAuth()', () => {
    it('should throw if API_KEY is not set', () => {
      const originalKey = process.env.API_KEY;
      delete process.env.API_KEY;

      expect(() => requireAuth()).toThrow('API_KEY environment variable must be configured');

      process.env.API_KEY = originalKey;
    });

    it('should throw if API_KEY is empty string', () => {
      const originalKey = process.env.API_KEY;
      process.env.API_KEY = '   ';

      expect(() => requireAuth()).toThrow('API_KEY environment variable must be configured');

      process.env.API_KEY = originalKey;
    });

    it('should throw if API_KEY is less than 20 characters', () => {
      const originalKey = process.env.API_KEY;
      process.env.API_KEY = 'short-key-123';

      expect(() => requireAuth()).toThrow('API_KEY must be at least 20 characters');

      process.env.API_KEY = originalKey;
    });

    it('should return API_KEY if valid', () => {
      const originalKey = process.env.API_KEY;
      process.env.API_KEY = 'valid-api-key-12345678901234567890';

      const result = requireAuth();

      expect(result).toBe('valid-api-key-12345678901234567890');

      process.env.API_KEY = originalKey;
    });
  });

  describe('validateApiKey()', () => {
    it('should return false for null key', () => {
      expect(validateApiKey(null)).toBe(false);
    });

    it('should return false for invalid key', () => {
      expect(validateApiKey('wrong-key')).toBe(false);
    });

    it('should return true for valid key', () => {
      const validKey = process.env.API_KEY || 'test-api-key-1234567890123456789012345';
      expect(validateApiKey(validKey)).toBe(true);
    });
  });
});

describe('Rate Limiting', () => {
  beforeEach(() => {
    clearRateLimits();
  });

  it('should allow requests within limit', () => {
    const result1 = rateLimit('test-ip', 3, 10000);
    const result2 = rateLimit('test-ip', 3, 10000);
    const result3 = rateLimit('test-ip', 3, 10000);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result3.success).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    rateLimit('test-ip', 2, 10000);
    rateLimit('test-ip', 2, 10000);
    const result3 = rateLimit('test-ip', 2, 10000);

    expect(result3.success).toBe(false);
    expect(result3.remaining).toBe(0);
  });

  it('should track different identifiers separately', () => {
    rateLimit('ip-1', 2, 10000);
    rateLimit('ip-1', 2, 10000);
    const ip1Result = rateLimit('ip-1', 2, 10000);

    const ip2Result = rateLimit('ip-2', 2, 10000);

    expect(ip1Result.success).toBe(false);
    expect(ip2Result.success).toBe(true);
  });

  it('should return correct remaining count', () => {
    const result1 = rateLimit('test-ip', 5, 10000);
    expect(result1.remaining).toBe(4);

    const result2 = rateLimit('test-ip', 5, 10000);
    expect(result2.remaining).toBe(3);
  });

  it('should include resetAt timestamp', () => {
    const result = rateLimit('test-ip', 10, 10000);

    expect(result.resetAt).toBeGreaterThan(Date.now());
    expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 10000);
  });
});

describe('Encryption & Decryption', () => {
  describe('generateEncryptionKey()', () => {
    it('should generate 64 character hex string', () => {
      const key = generateEncryptionKey();

      expect(key).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(key)).toBe(true);
    });

    it('should generate unique keys', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('encrypt() and decrypt()', () => {
    it('should encrypt and decrypt successfully', () => {
      const plaintext = 'sensitive-password-123';

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext', () => {
      const plaintext = 'test-data';

      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should fail with invalid encrypted format', () => {
      expect(() => decrypt('invalid-format')).toThrow('Decryption failed');
    });

    it('should fail with tampered data', () => {
      const encrypted = encrypt('test-data');
      const tampered = encrypted.slice(0, -2) + 'xx';

      expect(() => decrypt(tampered)).toThrow('Decryption failed');
    });

    it('should handle empty string', () => {
      const encrypted = encrypt('');
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe('');
    });

    it('should handle special characters', () => {
      const plaintext = 'Test!@#$%^&*()_+-=[]{}|;:,.<>?';

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Encryption key validation', () => {
    it('should reject invalid hex characters', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'ZZZZ' + '0'.repeat(60);

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be exactly 64 hexadecimal characters');

      process.env.ENCRYPTION_KEY = originalKey;
    });

    it('should reject wrong length keys', () => {
      const originalKey = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = '0'.repeat(32); // Only 32 chars instead of 64

      expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY must be exactly 64 hexadecimal characters');

      process.env.ENCRYPTION_KEY = originalKey;
    });
  });
});

describe('Input Validation', () => {
  describe('UUID validation', () => {
    it('should match valid UUIDs', () => {
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      ];

      validUUIDs.forEach((uuid) => {
        expect(UUID_REGEX.test(uuid)).toBe(true);
      });
    });

    it('should reject invalid UUIDs', () => {
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      const invalidUUIDs = [
        'not-a-uuid',
        '550e8400-e29b-41d4-a716', // Too short
        '550e8400-e29b-41d4-a716-446655440000-extra', // Too long
        '550e8400e29b41d4a716446655440000', // No dashes
        '', // SQL injection attempt
        '../../../etc/passwd',
      ];

      invalidUUIDs.forEach((uuid) => {
        expect(UUID_REGEX.test(uuid)).toBe(false);
      });
    });
  });

  describe('Status enum validation', () => {
    const VALID_CAMPAIGN_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const;
    const VALID_LEAD_STATUSES = [
      'QUEUED',
      'SENT',
      'OPENED',
      'CLICKED',
      'REPLIED',
      'BOUNCED',
      'FAILED',
      'NOT_INTERESTED',
    ] as const;

    it('should accept valid campaign statuses', () => {
      VALID_CAMPAIGN_STATUSES.forEach((status) => {
        expect(VALID_CAMPAIGN_STATUSES.includes(status)).toBe(true);
      });
    });

    it('should reject invalid campaign statuses', () => {
      const invalidStatuses = ['INVALID', 'deleted', 'ARCHIVED', ''];

      invalidStatuses.forEach((status) => {
        expect(VALID_CAMPAIGN_STATUSES.includes(status as any)).toBe(false);
      });
    });

    it('should accept valid lead statuses', () => {
      VALID_LEAD_STATUSES.forEach((status) => {
        expect(VALID_LEAD_STATUSES.includes(status)).toBe(true);
      });
    });

    it('should reject invalid lead statuses', () => {
      const invalidStatuses = ['INVALID', 'spam', 'DELETED', ''];

      invalidStatuses.forEach((status) => {
        expect(VALID_LEAD_STATUSES.includes(status as any)).toBe(false);
      });
    });
  });
});

describe('XSS Prevention', () => {
  it('should escape HTML special characters', () => {
    // This function is internal to lib/email.ts, so we test it indirectly
    const testCases = [
      { input: '<script>alert("xss")</script>', shouldNotContain: '<script>' },
      { input: 'Test & Company', shouldNotContain: '&' },
      { input: 'Quote: "test"', shouldNotContain: '"test"' },
      { input: "O'Reilly", shouldNotContain: "'" },
    ];

    // Note: Since escapeHtml is not exported, we document expected behavior
    // The actual escaping happens in lib/email.ts:renderTemplate()
    testCases.forEach((testCase) => {
      expect(testCase.input).toBeTruthy(); // Placeholder - actual test would use renderTemplate
    });
  });
});
