import { Injectable } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import { renderEmail } from './email-templates';
import type { EmailOutboxEntity } from './entities/email-outbox.entity';

@Injectable()
export class SmtpEmailSender {
  private readonly transporter: Transporter;
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST ?? '127.0.0.1',
      port: Number(process.env.MAIL_PORT ?? 1025),
      secure: process.env.MAIL_SECURE === 'true',
      ...(process.env.MAIL_USER ? { auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD ?? '' } } : {}),
    });
  }
  async send(message: EmailOutboxEntity): Promise<void> {
    const rendered = await renderEmail(message.messageType, message.locale, message.payload);
    await this.transporter.sendMail({ from: process.env.MAIL_FROM ?? 'Smoelenboek <noreply@smoelenboek.local>', to: message.recipient, ...rendered });
  }
}
