import { Lead } from '../email';

export function generateBusinessCard(lead: Lead): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';

  // Placeholder Assets - User should replace these
  // NOTE: Localhost images won't load in Gmail. Using public placeholder for now.
  const headshotUrl = "https://ui-avatars.com/api/?name=Chudi+Nnorukam&background=0D8ABC&color=fff&size=128";
  const portfolioUrl = "https://chudi-nnorukam-portfolio.vercel.app/";
  const linkedinUrl = "https://www.linkedin.com/in/chudi-nnorukam-b91203143/";
  const physicalAddress = "San Francisco, CA";

  return `
<br>
<table cellpadding="0" cellspacing="0" border="0" style="border-top: 1px solid #eaeaea; margin-top: 20px; padding-top: 20px; width: 100%; max-width: 600px;">
  <tr>
    <td style="padding-right: 15px; vertical-align: top; width: 60px;">
      <img src="${headshotUrl}" alt="Chudi Nnorukam" width="60" height="60" style="border-radius: 50%; display: block; width: 60px; height: 60px;">
    </td>
    <td style="vertical-align: top;">
      <p style="margin: 0; font-family: Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; color: #333;">Chudi Nnorukam</p>
      <p style="margin: 2px 0 8px 0; font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: #666;">Web Developer & Systems Architect</p>
      <p style="margin: 0; font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #999;">
        <a href="${portfolioUrl}" style="color: #0066CC; text-decoration: none; font-weight: bold;">Portfolio</a>
        <span style="color: #ccc; margin: 0 5px;">|</span>
        <a href="${linkedinUrl}" style="color: #0066CC; text-decoration: none; font-weight: bold;">LinkedIn</a>
      </p>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding-top: 15px; font-family: Helvetica, Arial, sans-serif; font-size: 10px; color: #aaa; line-height: 1.4;">
      <a href="${appUrl}/api/unsubscribe?leadId=${lead.id}" style="color: #aaa; text-decoration: underline;">Unsubscribe</a>
      <br>
      ${physicalAddress}
    </td>
  </tr>
</table>
    `;
}
