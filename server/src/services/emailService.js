const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
      try {
        this.transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: Number(SMTP_PORT),
          secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
          }
        });
        console.log('[EmailService] SMTP transporter initialized successfully');
      } catch (err) {
        console.warn('[EmailService] Failed to initialize SMTP transporter:', err.message);
      }
    } else {
      console.log('[EmailService] SMTP credentials not provided. Running in Development Console Mode (OTPs will be logged to console).');
    }
  }

  async sendOtpEmail(toEmail, otp, name = 'User') {
    const subject = 'EduSetu Account Verification - One Time Password (OTP)';
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Welcome to EduSetu! 🚀</h2>
        <p>Hello <b>${name}</b>,</p>
        <p>Thank you for registering with EduSetu. To complete your account verification, please use the One-Time Password (OTP) below:</p>

        <div style="background-color: #f3f4f6; padding: 16px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1f2937; border-radius: 6px; margin: 20px 0;">
          ${otp}
        </div>

        <p>This verification code is valid for <b>10 minutes</b>. Please do not share this code with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">EduSetu Education Platform · Empowering Learning Across India</p>
      </div>
    `;

    const textBody = `Hello ${name},\n\nYour EduSetu verification OTP is: ${otp}\n\nThis code is valid for 10 minutes.`;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"EduSetu Education" <noreply@edusetu.org>',
          to: toEmail,
          subject,
          text: textBody,
          html: htmlBody
        });
        console.log(`[EmailService] OTP email sent to ${toEmail}: messageId=${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.error('[EmailService] Error sending email via SMTP:', error.message);
        // Fall back to development console logging if SMTP fails
        console.log(`========================================`);
        console.log(`[EmailService (Fallback DEV)] OTP for ${toEmail}: ${otp}`);
        console.log(`========================================`);
        return { success: true, devMode: true };
      }
    } else {
      console.log(`========================================`);
      console.log(`[EmailService (DEV)] OTP for ${toEmail}: ${otp}`);
      console.log(`========================================`);
      return { success: true, devMode: true };
    }
  }
}

module.exports = new EmailService();
