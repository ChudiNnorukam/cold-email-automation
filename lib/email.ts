import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { decrypt } from './crypto';

interface SmtpConfig {
  host: string | null;
  port: number | null;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
}

interface Template {
  subject: string;
  body: string;
}

export async function createTransport(smtpConfig: SmtpConfig): Promise<Transporter> {
  const password = decrypt(smtpConfig.password);

  return nodemailer.createTransport({
    host: smtpConfig.host!,
    port: smtpConfig.port!,
    secure: smtpConfig.secure, // false for port 587 (STARTTLS)
    requireTLS: true, // Force TLS
    auth: {
      user: smtpConfig.user,
      pass: password,
    },
    tls: {
      // Don't fail on invalid certs (for development)
      rejectUnauthorized: true,
    },
  });
}

/**
 * Escape HTML special characters to prevent XSS attacks
 * Protects against malicious data in lead fields (name, company, email)
 */
export function renderTemplate(templateText: string, lead: Lead): string {
  // 1. Handle Name Edge Cases
  let safeName = lead.name;
  if (!safeName || safeName.toLowerCase().includes('unknown') || safeName.trim() === '') {
    safeName = "there";
  } else {
    // Capitalize first letter just in case
    safeName = safeName.charAt(0).toUpperCase() + safeName.slice(1);
  }

  // 2. Handle Company Edge Cases
  let safeCompany = lead.company;
  // Remove common suffixes
  const suffixes = [', LLC', ' LLC', ', Inc.', ' Inc.', ', Inc', ' Inc', ' Ltd.', ' Ltd', ' Pty Ltd'];
  for (const suffix of suffixes) {
    if (safeCompany.endsWith(suffix)) {
      safeCompany = safeCompany.slice(0, -suffix.length);
    }
  }
  // Remove domain extensions if company name is a URL
  if (safeCompany.includes('.') || safeCompany.includes('www')) {
    // Remove protocol
    safeCompany = safeCompany.replace(/(https?:\/\/)?(www\.)?/, '');

    // Remove TLD (simple approach: take everything before the first dot, or last dot if multiple?)
    // Better approach: split by dot, take first part unless it's common generic
    const parts = safeCompany.split('.');
    if (parts.length > 0) {
      safeCompany = parts[0];
    }

    // Replace hyphens with spaces (e.g. "my-company" -> "my company")
    safeCompany = safeCompany.replace(/-/g, ' ');
  }
  // Capitalize (Title Case)
  safeCompany = safeCompany.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // 3. Handle City (if we had a city field, for now fallback)
  const safeCity = "your area";

  return templateText
    .replace(/\{\{Name\}\}/g, safeName)
    .replace(/\{\{Company\}\}/g, safeCompany)
    .replace(/\[City\]/g, safeCity)
    .replace(/\{\{Email\}\}/g, lead.email);
}

export async function sendEmail(
  config: SmtpConfig,
  template: Template,
  lead: Lead
): Promise<void> {
  const transport = await createTransport(config);
  const body = renderTemplate(template.body, lead);
  const subject = renderTemplate(template.subject, lead);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';

  // Generate unique message ID for tracking and deliverability
  const messageId = `<${lead.id}-${Date.now()}@${config.fromEmail.split('@')[1]}>`;

  await transport.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: lead.email,
    subject,
    text: body,
    messageId,
    headers: {
      // Unsubscribe headers (RFC 8058 - required for bulk email)
      'List-Unsubscribe': `<${appUrl}/api/unsubscribe?leadId=${lead.id}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',

      // Identification headers for better deliverability
      'X-Mailer': 'Cold Email Automation Tool',
      'X-Priority': '3', // Normal priority (1=high, 3=normal, 5=low)
      'X-MSMail-Priority': 'Normal',
      'Importance': 'Normal',

      // Prevent auto-replies and delivery reports
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Precedence': 'bulk',

      // Entity and feedback headers
      'Feedback-ID': `campaign:${lead.id}:${config.fromEmail.split('@')[1]}`,
      'X-Entity-Ref-ID': lead.id,

      // Return path for bounce handling
      'Return-Path': config.fromEmail,
    },
  });
}

export async function testConnection(config: SmtpConfig): Promise<boolean> {
  try {
    const transport = await createTransport(config);
    await transport.verify();
    return true;
  } catch (error) {
    console.error('SMTP connection test failed:', error);
    return false;
  }
}
