let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('[EmailService] nodemailer not installed or unavailable.');
}

const isProduction = () => process.env.NODE_ENV === 'production';

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (!nodemailer) {
      if (isProduction()) {
        console.error('[EmailService] nodemailer is unavailable; OTP email cannot be sent in production.');
      } else {
        console.log('[EmailService] nodemailer not available. Development console OTP mode enabled.');
      }
      return;
    }

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
      try {
        this.transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: Number(SMTP_PORT),
          secure: Number(SMTP_PORT) === 465,
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
          }
        });
        console.log('[EmailService] SMTP transporter initialized successfully');
      } catch (err) {
        console.error('[EmailService] Failed to initialize SMTP transporter:', err.message);
      }
    } else if (isProduction()) {
      console.error('[EmailService] SMTP credentials are missing; OTP email cannot be sent in production.');
    } else {
      console.log('[EmailService] SMTP credentials not provided. Development console OTP mode enabled.');
    }
  }

  async sendOtpEmail(toEmail, otp, name = 'User') {
    const subject = 'EduSetu Account Verification - One Time Password (OTP)';
    const safeName = escapeHtml(name);
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Welcome to EduSetu</h2>
        <p>Hello <b>${safeName}</b>,</p>
        <p>Thank you for registering with EduSetu. To complete your account verification, please use the One-Time Password (OTP) below:</p>

        <div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1f2937; border-radius: 6px; margin: 20px 0;">
          ${otp}
        </div>

        <p>This verification code is valid for <b>10 minutes</b>. Please do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">EduSetu Education Platform</p>
      </div>
    `;

    const textBody = `Hello ${name},\n\nYour EduSetu verification OTP is: ${otp}\n\nThis code is valid for 10 minutes.`;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"EduSetu Education" <no-reply@edusetu.in>',
          to: toEmail,
          subject,
          text: textBody,
          html: htmlBody
        });
        console.log(`[EmailService] OTP email sent to ${toEmail}: messageId=${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.error('[EmailService] Error sending email via SMTP:', error.message);
        if (isProduction()) throw new Error('Failed to send verification email');
      }
    } else if (isProduction()) {
      throw new Error('Email service is not configured');
    }

    // Development-only console fallback. Never reached in production.
    console.log('========================================');
    console.log(`[EmailService (DEV)] OTP for ${toEmail}: ${otp}`);
    console.log('========================================');
    return { success: true, devMode: true };
  }
}

module.exports = new EmailService();
