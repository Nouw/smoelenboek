import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import nodemailer from 'nodemailer';

import type { RpcEnv } from '../config/env';
import { EmailOutboxProcessor } from './email-outbox.processor';
import { EmailOutboxRepository } from './email-outbox.repository';
import { EmailOutboxEntity } from './entities/email-outbox.entity';
import {
  createSmtpTransportOptions,
  SMTP_CONFIGURATION,
  SMTP_TRANSPORTER,
  type SmtpEmailConfiguration,
} from './smtp-email.config';
import { SmtpEmailSender } from './smtp-email.sender';

@Module({
  imports: [TypeOrmModule.forFeature([EmailOutboxEntity])],
  providers: [
    {
      provide: SMTP_CONFIGURATION,
      inject: [ConfigService],
      useFactory: (
        config: ConfigService<RpcEnv, true>,
      ): SmtpEmailConfiguration => ({
        host: config.get('MAIL_HOST', { infer: true }),
        port: config.get('MAIL_PORT', { infer: true }),
        secure: config.get('MAIL_SECURE', { infer: true }),
        requireTls: config.get('MAIL_REQUIRE_TLS', { infer: true }),
        rejectUnauthorized: config.get('MAIL_REJECT_UNAUTHORIZED', {
          infer: true,
        }),
        from: config.get('MAIL_FROM', { infer: true }),
        user: config.get('MAIL_USER', { infer: true }),
        password: config.get('MAIL_PASSWORD', { infer: true }),
        verifyOnStartup: config.get('MAIL_VERIFY_ON_STARTUP', { infer: true }),
        connectionTimeoutMs: config.get('MAIL_CONNECTION_TIMEOUT_MS', {
          infer: true,
        }),
        greetingTimeoutMs: config.get('MAIL_GREETING_TIMEOUT_MS', {
          infer: true,
        }),
        socketTimeoutMs: config.get('MAIL_SOCKET_TIMEOUT_MS', { infer: true }),
      }),
    },
    {
      provide: SMTP_TRANSPORTER,
      inject: [SMTP_CONFIGURATION],
      useFactory: (config: SmtpEmailConfiguration) =>
        nodemailer.createTransport(createSmtpTransportOptions(config)),
    },
    EmailOutboxRepository,
    SmtpEmailSender,
    EmailOutboxProcessor,
  ],
  exports: [EmailOutboxRepository],
})
export class EmailModule {}
