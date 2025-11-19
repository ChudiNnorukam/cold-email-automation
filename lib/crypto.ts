import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // Validate key format: must be exactly 64 hex characters (32 bytes for AES-256)
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      'ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes). ' +
      'Generate one using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  const buffer = Buffer.from(key, 'hex');

  // Double-check buffer length (redundant but explicit)
  if (buffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  return buffer;
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('DECRYPT_FORMAT_ERROR');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // Validate hex format before attempting conversion
    if (!/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(authTagHex) || !/^[0-9a-fA-F]*$/.test(encrypted)) {
      throw new Error('DECRYPT_INVALID_HEX');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('DECRYPT_INVALID_LENGTHS');
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    // Map internal errors to safe user-facing messages
    const errorCode = error.message || 'UNKNOWN';

    if (errorCode.startsWith('DECRYPT_')) {
      // Our validation errors - safe to expose
      throw new Error(`Decryption failed: ${errorCode.replace('DECRYPT_', '').toLowerCase()}`);
    } else if (errorCode.includes('Unsupported state') || errorCode.includes('auth')) {
      // Crypto library errors - possible tampering
      throw new Error('Decryption failed: data has been tampered with or encryption key changed');
    } else {
      // Unknown errors - don't leak internals
      console.error('Decryption error:', error);
      throw new Error('Decryption failed: unable to decrypt data');
    }
  }
}

export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
