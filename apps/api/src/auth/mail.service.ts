import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private from: string;
  private baseUrl: string;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = this.config.get<number>('SMTP_PORT');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    this.from = this.config.get<string>('EMAIL_FROM') || 'noreply@fars.local';
    this.baseUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: port === 465,
        auth: { user, pass },
      });
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      console.log('[Mail] No SMTP configured. Would send:', { to, subject });
      return;
    }
    await this.transporter.sendMail({ from: this.from, to, subject, html });
  }

  async sendVerificationEmail(email: string, name: string, token: string) {
    const link = `${this.baseUrl}/confirm-email?token=${encodeURIComponent(token)}`;
    await this.send(
      email,
      'Confirm your email — FARS',
      `Hello ${name},<br><br>Please confirm your email: <a href="${link}">${link}</a><br><br>FARS Messenger`,
    );
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const link = `${this.baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await this.send(
      email,
      'Reset your password — FARS',
      `Hello ${name},<br><br>Reset password: <a href="${link}">${link}</a><br><br>FARS Messenger`,
    );
  }
}
