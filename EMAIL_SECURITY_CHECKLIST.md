# Email Security & Deliverability Checklist

This checklist ensures your cold email automation tool is secure, compliant, and optimized for deliverability.

---

## = Security Configuration

### Environment Variables (Required)

- [ ] `API_KEY` - At least 20 characters for authentication
- [ ] `CRON_SECRET` - Secure token for cron endpoint (use: `openssl rand -base64 32`)
- [ ] `ENCRYPTION_KEY` - Exactly 64 hex characters (use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] `DATABASE_URL` - SQLite file path (e.g., `file:./prisma/dev.db`)
- [ ] `NEXT_PUBLIC_APP_URL` - Full application URL for unsubscribe links

### Verify Security Implementation

Run the verification script:
```bash
node verify-security.js
```

Expected output: All checks should pass 

---

## =ç DNS Configuration (Critical for Deliverability)

### SPF (Sender Policy Framework)

Add TXT record to your domain:
```
v=spf1 include:_spf.google.com ~all
```

**For Gmail/Google Workspace:**
```
v=spf1 include:_spf.google.com ~all
```

**For Outlook/Microsoft 365:**
```
v=spf1 include:spf.protection.outlook.com ~all
```

**Verification:**
```bash
dig TXT yourdomain.com | grep spf
```

### DKIM (DomainKeys Identified Mail)

**Gmail Setup:**
1. Go to: https://admin.google.com
2. Navigate to: Apps ’ Google Workspace ’ Gmail ’ Authenticate email
3. Click "Generate new record"
4. Add TXT record to DNS:
   - Name: `google._domainkey`
   - Value: (provided by Google)

**Verification:**
```bash
dig TXT google._domainkey.yourdomain.com
```

### DMARC (Domain-based Message Authentication)

Add TXT record:
```
_dmarc.yourdomain.com TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@yourdomain.com"
```

**Start with monitoring:**
```
v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

**Then enforce after 2 weeks:**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com; pct=10
```

**Verification:**
```bash
dig TXT _dmarc.yourdomain.com
```

### DNS Verification Tools

- https://mxtoolbox.com/spf.aspx
- https://mxtoolbox.com/dkim.aspx
- https://mxtoolbox.com/dmarc.aspx

---

## =è SMTP Configuration

### Gmail / Google Workspace

- [ ] Enable 2-Factor Authentication
- [ ] Generate App Password: https://myaccount.google.com/apppasswords
- [ ] Use SMTP settings:
  - Host: `smtp.gmail.com`
  - Port: `587`
  - Secure: `false`
  - TLS: `true` (STARTTLS)
- [ ] Daily limit: Start with 50, max 100 for personal Gmail, 2000 for Workspace

### Outlook / Microsoft 365

- [ ] Use SMTP settings:
  - Host: `smtp.office365.com`
  - Port: `587`
  - Secure: `false`
  - TLS: `true`
- [ ] Daily limit: Start with 100, max 200 for personal, 10,000 for Business

### Test SMTP Connection

```bash
node test-email.js
```

Expected:  SMTP connection verified, test email sent

---

## <¯ Email Warmup Strategy

### Week 1: Foundation (Days 1-7)
- **Volume:** 5-10 emails/day
- **Recipients:** Known contacts, team members
- **Action:** Monitor for bounces, check spam folder placement

### Week 2: Gradual Increase (Days 8-14)
- **Volume:** 15-25 emails/day
- **Action:** Mix cold leads with warm contacts (70/30)

### Week 3: Ramp Up (Days 15-21)
- **Volume:** 30-50 emails/day
- **Action:** Increase cold outreach, monitor engagement rates

### Week 4+: Full Capacity (Day 22+)
- **Volume:** Up to daily limit
- **Monitoring:** Track bounce rate (<3%), spam complaints (<0.1%)

---

##  Pre-Launch Checklist

### Application Security

- [ ] All environment variables configured
- [ ] API key authentication enabled in middleware
- [ ] CRON_SECRET validated for automated jobs
- [ ] Encryption key is 64 hex characters
- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] Rate limiting active on API routes
- [ ] XSS escaping enabled in templates

### Email Deliverability

- [ ] SPF record configured and verified
- [ ] DKIM record configured and verified
- [ ] DMARC policy set to monitoring mode
- [ ] SMTP credentials tested successfully
- [ ] Test email received in inbox (not spam)
- [ ] Unsubscribe link functional
- [ ] From email matches domain (no mismatch)

### Compliance

- [ ] List-Unsubscribe header included (RFC 8058)
- [ ] One-click unsubscribe implemented
- [ ] Privacy policy accessible
- [ ] CAN-SPAM Act compliance:
  - [ ] Accurate From/Reply-To addresses
  - [ ] Clear identification as advertisement (if applicable)
  - [ ] Physical mailing address in footer (if required)
  - [ ] Honor unsubscribe within 10 days

### Testing

- [ ] Security tests passing (`npm test __tests__/security.test.ts`)
- [ ] Email tests passing (`npm test __tests__/email.test.ts`)
- [ ] Manual test campaign sent to yourself
- [ ] Verified email headers (Message-ID, Feedback-ID, etc.)

---

## =Ê Ongoing Monitoring

### Daily Checks

- Check bounce rate: Should be <3%
  ```sql
  SELECT
    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) * 100.0 / COUNT(*) as bounce_rate
  FROM CampaignLead
  WHERE sentAt > datetime('now', '-1 day');
  ```

- Check daily send limits:
  ```sql
  SELECT sentToday, dailyLimit FROM SmtpConfig;
  ```

### Weekly Reviews

- Monitor engagement rates (opens, clicks, replies)
- Review spam complaints (check Gmail Postmaster Tools)
- Adjust sending volume based on performance
- Update lead lists (remove bounces, unsubscribes)

### Email Reputation Tools

- **Gmail Postmaster Tools:** https://postmaster.google.com
- **Microsoft SNDS:** https://sendersupport.olc.protection.outlook.com/snds/
- **Check blacklists:** https://mxtoolbox.com/blacklists.aspx

---

## =¨ Incident Response

### High Bounce Rate (>5%)

1. Pause all campaigns immediately
2. Review recent lead lists for invalid emails
3. Verify DNS records haven't changed
4. Check SMTP credentials

### Spam Complaints (>0.1%)

1. Reduce daily send volume by 50%
2. Review email content for spam triggers
3. Verify unsubscribe link is prominent
4. Segment list to engaged users only

### Blacklisted IP/Domain

1. Identify blacklist: Use https://mxtoolbox.com/blacklists.aspx
2. Request delisting through blacklist's removal process
3. Fix underlying issue (usually spam complaints or bounces)
4. Implement stricter list hygiene

---

## =Ú Resources

- **CAN-SPAM Act:** https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- **RFC 8058 (Unsubscribe):** https://datatracker.ietf.org/doc/html/rfc8058
- **Google Email Sender Guidelines:** https://support.google.com/mail/answer/81126
- **Microsoft Email Best Practices:** https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/email-best-practices

---

## ( Best Practices Summary

1. **Start slow:** Warmup period is critical for reputation
2. **Monitor closely:** Daily checks for first month
3. **Quality over quantity:** Better to send 50 quality emails than 500 spam
4. **Personalize:** Use {{Name}}, {{Company}} placeholders effectively
5. **Provide value:** Every email should solve a problem for the recipient
6. **Honor unsubscribes:** Immediately remove unsubscribed leads
7. **Keep lists clean:** Remove bounces and inactive contacts monthly
8. **Test everything:** Send test emails before launching campaigns

---

**Last Updated:** January 2025
**Version:** 1.0
