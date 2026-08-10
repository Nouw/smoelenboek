import {
  Inject,
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import type { Transporter } from 'nodemailer';

import { renderEmail } from './email-templates';
import type { EmailOutboxEntity } from './entities/email-outbox.entity';
import {
  SMTP_CONFIGURATION,
  SMTP_TRANSPORTER,
  type SmtpEmailConfiguration,
} from './smtp-email.config';

@Injectable()
export class SmtpEmailSender implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(SMTP_CONFIGURATION)
    private readonly config: SmtpEmailConfiguration,
    @Inject(SMTP_TRANSPORTER) private readonly transporter: Transporter,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.config.verifyOnStartup) return;

    try {
      await this.transporter.verify();
      console.info(
        JSON.stringify({
          event: 'email.smtp_verified',
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
        }),
      );
    } catch (error) {
      throw new Error(
        `SMTP startup verification failed (${smtpErrorCode(error)}).`,
      );
    }
  }

  onModuleDestroy(): void {
    this.transporter.close();
  }

  async send(message: EmailOutboxEntity): Promise<void> {
    const rendered = await renderEmail(
      message.messageType,
      message.locale,
      message.payload,
    );
    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to: message.recipient,
        ...rendered,
      });
    } catch (error) {
      throw new Error(`SMTP delivery failed (${smtpErrorCode(error)}).`);
    }
  }
}

function smtpErrorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null) return 'UNKNOWN';
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && /^[A-Z0-9_]+$/.test(code)
    ? code
    : 'UNKNOWN';
}
