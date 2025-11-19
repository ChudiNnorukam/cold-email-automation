#!/usr/bin/env node

/**
 * Security Verification Script
 * Validates that all security measures are properly configured
 *
 * Run: node verify-security.js
 */

require('dotenv').config();

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, errorMessage) {
  const result = { name, passed: condition, errorMessage };
  checks.push(result);

  if (condition) {
    passed++;
    console.log(` ${name}`);
  } else {
    failed++;
    console.log(`L ${name}`);
    if (errorMessage) {
      console.log(`   ’ ${errorMessage}`);
    }
  }
}

console.log('= Cold Email Tool - Security Verification\n');
console.log('='.repeat(50));
console.log('\n=Ý Environment Variables:\n');

// API_KEY validation
const apiKey = process.env.API_KEY;
check(
  'API_KEY is set',
  !!apiKey,
  'Set API_KEY in .env file'
);
check(
  'API_KEY length >= 20 characters',
  apiKey && apiKey.length >= 20,
  'API_KEY must be at least 20 characters for security'
);

// CRON_SECRET validation
const cronSecret = process.env.CRON_SECRET;
check(
  'CRON_SECRET is set',
  !!cronSecret,
  'Generate: openssl rand -base64 32'
);
check(
  'CRON_SECRET length >= 20 characters',
  cronSecret && cronSecret.length >= 20,
  'CRON_SECRET should be at least 20 characters'
);

// ENCRYPTION_KEY validation
const encryptionKey = process.env.ENCRYPTION_KEY;
check(
  'ENCRYPTION_KEY is set',
  !!encryptionKey,
  'Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
);
check(
  'ENCRYPTION_KEY is 64 hex characters',
  encryptionKey && /^[0-9a-fA-F]{64}$/.test(encryptionKey),
  'Must be exactly 64 hexadecimal characters (32 bytes)'
);

// DATABASE_URL validation
const databaseUrl = process.env.DATABASE_URL;
check(
  'DATABASE_URL is set',
  !!databaseUrl,
  'Set DATABASE_URL=file:./prisma/dev.db'
);

// NEXT_PUBLIC_APP_URL validation
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
check(
  'NEXT_PUBLIC_APP_URL is set',
  !!appUrl,
  'Required for unsubscribe links (e.g., http://localhost:3000)'
);
check(
  'NEXT_PUBLIC_APP_URL is valid URL',
  appUrl && (appUrl.startsWith('http://') || appUrl.startsWith('https://')),
  'Must start with http:// or https://'
);

console.log('\n=Á File Structure:\n');

// Check for critical files
const fs = require('fs');
const path = require('path');

check(
  'lib/auth.ts exists',
  fs.existsSync(path.join(__dirname, 'lib/auth.ts')),
  'Authentication module missing'
);
check(
  'lib/rate-limit.ts exists',
  fs.existsSync(path.join(__dirname, 'lib/rate-limit.ts')),
  'Rate limiting module missing'
);
check(
  'lib/crypto.ts exists',
  fs.existsSync(path.join(__dirname, 'lib/crypto.ts')),
  'Encryption module missing'
);
check(
  'middleware.ts exists',
  fs.existsSync(path.join(__dirname, 'middleware.ts')),
  'Route protection middleware missing'
);

console.log('\n>ê Test Files:\n');

check(
  '__tests__/security.test.ts exists',
  fs.existsSync(path.join(__dirname, '__tests__/security.test.ts')),
  'Security tests missing'
);
check(
  '__tests__/email.test.ts exists',
  fs.existsSync(path.join(__dirname, '__tests__/email.test.ts')),
  'Email tests missing'
);
check(
  'vitest.config.ts exists',
  fs.existsSync(path.join(__dirname, 'vitest.config.ts')),
  'Test configuration missing'
);

console.log('\n=Ë Documentation:\n');

check(
  'EMAIL_SECURITY_CHECKLIST.md exists',
  fs.existsSync(path.join(__dirname, 'EMAIL_SECURITY_CHECKLIST.md')),
  'Security checklist missing'
);

console.log('\n' + '='.repeat(50));
console.log(`\n=Ê Summary: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.log('   Please fix the failed checks before deploying to production.\n');
  process.exit(1);
} else {
  console.log('<‰ All security checks passed! Your application is properly configured.\n');
  console.log('=Ú Next steps:');
  console.log('   1. Run database migration: npx prisma migrate deploy');
  console.log('   2. Run tests: npm test');
  console.log('   3. Configure DNS records (see EMAIL_SECURITY_CHECKLIST.md)');
  console.log('   4. Test SMTP connection: node test-email.js');
  console.log('   5. Start email warmup process\n');
  process.exit(0);
}
