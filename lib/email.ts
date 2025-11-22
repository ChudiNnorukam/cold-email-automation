import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { decrypt } from './crypto';
import { generateBusinessCard } from './email-components/BusinessCard';

interface SmtpConfig {
  host: string | null;
  port: number | null;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

export interface Lead {
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
export function renderTemplate(templateText: string, lead: Lead, isBody: boolean = false, asHtml: boolean = false): string {
  // 1. Handle Name Edge Cases & Personalization Guardrails
  let safeName = lead.name;
  const genericNames = ['office', 'owner', 'support', 'admin', 'info', 'contact', 'sales', 'team'];

  if (!safeName || safeName.toLowerCase().includes('unknown') || safeName.trim() === '' || genericNames.includes(safeName.toLowerCase())) {
    safeName = "there";
  } else {
    // Capitalize first letter just in case
    safeName = safeName.charAt(0).toUpperCase() + safeName.slice(1);
  }

  // 2. Handle Company Edge Cases
  let safeCompany = lead.company;
  if (safeCompany) {
    // Strip legal suffixes (case insensitive regex is better than array loop)
    safeCompany = safeCompany.replace(/,\s*?llc\.?$/i, '')
      .replace(/\s+llc\.?$/i, '')
      .replace(/,\s*?inc\.?$/i, '')
      .replace(/\s+inc\.?$/i, '')
      .replace(/,\s*?ltd\.?$/i, '')
      .replace(/\s+ltd\.?$/i, '')
      .replace(/,\s*?corp\.?$/i, '')
      .replace(/\s+corp\.?$/i, '')
      .replace(/,\s*?pty\s+ltd\.?$/i, '')
      .replace(/\s+pty\s+ltd\.?$/i, '');

    // Remove domain extensions if company name is a URL
    if (safeCompany.includes('.') || safeCompany.includes('www')) {
      // Remove protocol
      safeCompany = safeCompany.replace(/(https?:\/\/)?(www\.)?/, '');

      // Remove TLD
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
      .join(' ')
      .trim();
  }

  // 3. Handle City (if we had a city field, for now fallback)
  const safeCity = "your area";

  let rendered = templateText
    .replace(/\{\{Name\}\}/g, safeName)
    .replace(/\{\{Company\}\}/g, safeCompany || 'your company')
    .replace(/\[City\]/g, safeCity)
    .replace(/\{\{Email\}\}/g, lead.email);

  // Append Compliance Footer ONLY for body
  if (isBody) {
    if (asHtml) {
      // Convert newlines to <br> for HTML body
      // Handle both \r\n and \n
      rendered = rendered.replace(/\r\n/g, '\n');
      rendered = rendered.replace(/\n/g, '<br>');
      // Append HTML Business Card
      rendered += generateBusinessCard(lead);
    } else {
      return rendered;
    }
  }

  return rendered;
}

export async function sendEmail(
  config: SmtpConfig,
  template: Template,
  lead: Lead
): Promise<void> {
  const transport = await createTransport(config);

  // Generate Plain Text Version
  const textBody = renderTemplate(template.body, lead, true, false);

  // Generate HTML Version
  const htmlBody = renderTemplate(template.body, lead, true, true);

  const subject = renderTemplate(template.subject, lead, false, false);

  console.log("DEBUG: HTML Body Preview:\n", htmlBody.substring(0, 200) + "...");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';

  // Generate unique message ID for tracking and deliverability
  const messageId = `<${lead.id}-${Date.now()}@${config.fromEmail.split('@')[1]}>`;

  await transport.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: lead.email,
    subject,
    text: textBody, // Plain text fallback
    html: htmlBody, // HTML version
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
