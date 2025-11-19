# Cold Email Automation - Setup Guide

## Overview
This automation system allows you to safely send cold outreach emails with human-like behavior patterns to avoid spam filters.

## Features
- ✅ **Encrypted SMTP credentials** (AES-256-GCM)
- ✅ **Smart delays** (2-10 minutes random between sends)
- ✅ **Daily limit enforcement** (default 50 emails/day)
- ✅ **Bounce detection** (auto-pause if >3% failure rate)
- ✅ **Unsubscribe headers** (List-Unsubscribe compliance)
- ✅ **Server-side cron automation** (runs every 5 minutes)

---

## Setup Instructions

### 1. Environment Variables

The following environment variables have been generated and added to `.env`:

```bash
ENCRYPTION_KEY="4116a1023adb5a6d2c43562a4101f8221808959f60252740d6d1ceab02ded646"
CRON_SECRET="DWT+i7+AGDndGy1kjWwI4KoNVtyvVLpYh80qK5Do410="
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**For production deployment:**
- Add these to your Vercel/hosting environment variables
- Update `NEXT_PUBLIC_APP_URL` to your production domain
- **NEVER commit `.env` to version control**

---

### 2. SMTP Configuration

#### Gmail Setup (Recommended for Testing)
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Navigate to **Security** → **2-Step Verification**
3. Scroll down to **App Passwords**
4. Generate a new app password for "Mail"
5. Copy the 16-character password

#### In the Application:
1. Navigate to `/settings`
2. Select **Gmail / Google Workspace**
3. Enter your Gmail address
4. Paste the app password
5. Set your "From Name" (e.g., "Chudi")
6. Set daily limit (start with 10-20 for testing)
7. Click **Save Configuration**
8. Click **Test Connection** to verify

#### Recommended Daily Limits:
- **Gmail (personal)**: 50
- **Google Workspace**: 100
- **Microsoft 365**: 200
- **Custom SMTP**: Check with your provider

---

### 3. DNS Configuration (CRITICAL for Deliverability)

**⚠️ Configure these BEFORE sending cold emails:**

#### SPF Record
Add to your domain's DNS:
```
TXT @ "v=spf1 include:_spf.google.com ~all"
```
(Replace with your email provider's SPF record)

#### DKIM
Enable DKIM in your email provider's settings and add the provided TXT record to DNS.

#### DMARC
Add to DNS:
```
TXT _dmarc "v=DMARC1; p=none; rua=mailto:your@email.com"
```

**Verify configuration:**
- [MXToolbox](https://mxtoolbox.com/)
- [Mail-Tester](https://www.mail-tester.com/)

---

### 4. Create Your First Campaign

1. **Add Leads** (`/leads`)
   - Import or manually add contacts
   - Ensure no duplicate emails

2. **Create Template** (`/templates`)
   - Use placeholders: `{{Name}}`, `{{Company}}`, `{{Email}}`
   - Keep it plain text (no HTML initially)
   - Keep subject line under 60 characters

3. **Create Campaign** (`/campaigns`)
   - Click **Create Campaign**
   - Select template
   - Select leads (duplicate emails are blocked)
   - Click **Create Campaign**

4. **Start Campaign**
   - Navigate to campaign detail page
   - Click **Start Campaign**
   - Emails will begin sending automatically

---

### 5. Automation Behavior

#### How It Works:
- Cron job runs every **5 minutes** (`vercel.json`)
- Processes up to **5 active campaigns** per run
- Sends **1 email** from each campaign
- Waits **2-10 minutes** (random) before scheduling next email
- Stops when:
  - Daily limit reached
  - Campaign completes
  - Bounce rate > 3%

#### Manual Cron Trigger (for testing):
```bash
curl -H "Authorization: Bearer DWT+i7+AGDndGy1kjWwI4KoNVtyvVLpYh80qK5Do410=" \
  http://localhost:3000/api/cron/send-emails
```

#### Expected Response:
```json
{
  "processed": 1,
  "results": [
    {
      "campaign": "abc123",
      "status": "sent",
      "leadEmail": "lead@example.com"
    }
  ],
  "timestamp": "2025-01-18T12:00:00.000Z"
}
```

---

### 6. Monitoring Campaigns

**Campaign Dashboard** (`/campaigns/[id]`)
- View real-time progress (sent/queued/failed)
- See individual lead status
- Monitor bounce rate
- Pause/Resume campaigns

**Status Indicators:**
- 🟢 **SENT** - Email delivered successfully
- 🔵 **QUEUED** - Waiting to send
- 🔴 **FAILED** - Send error (check error message)
- 🟡 **PAUSED** - Campaign paused (manual or auto due to bounce rate)

---

### 7. Safety Best Practices

#### Email Warm-Up Schedule:
- **Week 1**: 10 emails/day
- **Week 2**: 25 emails/day
- **Week 3**: 50 emails/day
- **Week 4+**: 100 emails/day (if Google Workspace)

#### Content Guidelines:
- Use plain text (no HTML)
- No tracking pixels initially
- Include unsubscribe link (automatic)
- Personalize with `{{Name}}` and `{{Company}}`
- Avoid spam trigger words ("free", "guarantee", etc.)

#### Lead Quality:
- Use **real, relevant contacts**
- Avoid **purchased lists**
- **Verify emails** before adding ([Hunter.io](https://hunter.io), [NeverBounce](https://neverbounce.com))
- Remove bounced emails immediately

---

### 8. Troubleshooting

#### SMTP Connection Failed
- Verify app password is correct
- Check 2FA is enabled (Gmail)
- Ensure "Less secure app access" is OFF (use app passwords)

#### Emails Not Sending
- Check daily limit not reached (`/settings`)
- Verify campaign status is **ACTIVE**
- Check cron job is running (manual trigger test)
- Review logs in deployment dashboard

#### High Bounce Rate (>3%)
- Campaign auto-pauses at 3% failure rate
- Verify email addresses before sending
- Check SPF/DKIM/DMARC records

#### Emails Going to Spam
- Warm up email address gradually
- Improve DNS configuration
- Use plain text (no HTML)
- Reduce send volume
- Improve email content quality

---

### 9. Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd cold-email-tool
vercel

# Add environment variables in Vercel dashboard:
# - ENCRYPTION_KEY
# - CRON_SECRET
# - NEXT_PUBLIC_APP_URL (auto-set by Vercel)
```

**Cron Job Setup:**
- Vercel automatically reads `vercel.json`
- Cron runs every 5 minutes on Hobby plan
- Check logs in Vercel dashboard → Logs tab

---

### 10. Testing Checklist

- [ ] SMTP configured and connection tested
- [ ] Environment variables set
- [ ] DNS records configured (SPF/DKIM/DMARC)
- [ ] Template created with placeholders
- [ ] Test leads added (use your own emails first)
- [ ] Campaign created with 2-3 test leads
- [ ] Campaign started
- [ ] Manual cron trigger successful
- [ ] Emails received with correct placeholders
- [ ] Unsubscribe link works
- [ ] List-Unsubscribe header present (check email source)

---

## Files Overview

**Core Automation:**
- `lib/crypto.ts` - Password encryption
- `lib/email.ts` - Email sending service
- `app/api/cron/send-emails/route.ts` - Cron job logic

**UI Components:**
- `app/settings/page.tsx` - SMTP configuration
- `app/campaigns/page.tsx` - Campaign list
- `app/campaigns/[id]/page.tsx` - Campaign detail
- `components/CreateCampaignDialog.tsx` - Campaign creation

**Safety Features:**
- Random delays (2-10 min)
- Daily limit enforcement
- Bounce detection (>3% auto-pause)
- Unsubscribe endpoint (`/api/unsubscribe`)

---

## Support

For issues or questions:
1. Check Vercel logs for errors
2. Test SMTP connection at `/settings`
3. Verify environment variables are set
4. Check DNS configuration with MXToolbox
5. Review email content for spam triggers

---

## Important Reminders

⚠️ **This tool does NOT:**
- Manage SPF/DKIM/DMARC (you must configure DNS)
- Verify email addresses (use external tool)
- Guarantee inbox delivery (depends on your setup)

✅ **This tool DOES:**
- Encrypt SMTP passwords
- Send emails with human-like delays
- Enforce daily limits
- Detect bounce rates
- Add unsubscribe headers
