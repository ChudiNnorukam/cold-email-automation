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
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: password,
    },
  });
}

export function renderTemplate(templateText: string, lead: Lead): string {
  return templateText
    .replace(/\{\{Name\}\}/g, lead.name)
    .replace(/\{\{Company\}\}/g, lead.company)
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

  await transport.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: lead.email,
    subject,
    text: body,
    headers: {
      'List-Unsubscribe': `<${appUrl}/api/unsubscribe?leadId=${lead.id}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
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
