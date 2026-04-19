import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailingService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailingService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('SMTP_USER'), // Your Gmail address
        pass: this.configService.get<string>('SMTP_PASS'), // Your Gmail App Password
      },
    });
  }

  /**
   * Sends an OTP email to the specified recipient.
   * @param to Recipient email address
   * @param otp The one-time password
   * @param purpose Reason for the OTP (e.g., 'Account Verification')
   */
  async sendOtp(to: string, otp: string, purpose: string = 'Account Verification') {
    const senderEmail = this.configService.get<string>('SMTP_USER') || 'noreply@sementeryo.com';

    const mailOptions = {
      from: `"Sementeryo System" <${senderEmail}>`,
      to,
      subject: `Your OTP for ${purpose}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 24px;">Verification Code</h1>
          </div>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hello,</p>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">Your one-time verification code for <strong>${purpose}</strong> is:</p>
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; color: #0284c7; margin: 25px 0;">
            ${otp}
          </div>
          <p style="color: #475569; font-size: 14px; margin-top: 20px; line-height: 1.5;">This code will expire in 10 minutes. Please do not share this code with anyone. Our staff will never ask you for this code.</p>
          <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 30px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5;">If you did not request this code, please ignore this email. No further action is required.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP Email sent successfully to ${to} (MessageID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Generic method for sending standard emails
   */
  async sendEmail(to: string, subject: string, htmlContent: string) {
    const senderEmail = this.configService.get<string>('SMTP_USER') || 'noreply@sementeryo.com';

    const mailOptions = {
      from: `"Sementeryo System" <${senderEmail}>`,
      to,
      subject,
      html: htmlContent,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${to} (MessageID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
