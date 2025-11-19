const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const prisma = new PrismaClient();

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function decrypt(encryptedText) {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function sendTestEmail() {
  const config = await prisma.smtpConfig.findFirst();

  if (!config) {
    console.log('❌ No SMTP config found');
    return;
  }

  console.log('📧 SMTP Config:');
  console.log('   Host:', config.host);
  console.log('   Port:', config.port);
  console.log('   Secure:', config.secure);
  console.log('   User:', config.user);
  console.log('   From:', config.fromEmail);

  const password = decrypt(config.password);

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: true,
    auth: {
      user: config.user,
      pass: password,
    },
  });

  console.log('\n🔍 Testing SMTP connection...');
  await transporter.verify();
  console.log('✅ SMTP connection verified!');

  console.log('\n📨 Sending test email...');
  const info = await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to: config.user, // Send to yourself
    subject: '🧪 Cold Email Tool - Test Email',
    text: `This is a test email from your cold email automation tool.

If you're reading this, your SMTP configuration is working perfectly! 🎉

Sent at: ${new Date().toLocaleString()}

Configuration:
- Host: ${config.host}
- Port: ${config.port}
- Secure: ${config.secure}
- From: ${config.fromEmail}

---
Cold Email Automation Tool
Powered by Claude Code`,
  });

  console.log('✅ Email sent successfully!');
  console.log('   Message ID:', info.messageId);
  console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
  console.log('\n📬 Check your inbox:', config.user);
}

sendTestEmail()
  .then(async () => {
    await prisma.$disconnect();
    console.log('\n✨ Test complete!');
  })
  .catch(async (e) => {
    console.error('\n❌ Error:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
