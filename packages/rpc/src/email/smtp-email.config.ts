import { isIP } from 'node:net';

import type SMTPPool from 'nodemailer/lib/smtp-pool';

export const SMTP_CONFIGURATION = Symbol('SMTP_CONFIGURATION');
export const SMTP_TRANSPORTER = Symbol('SMTP_TRANSPORTER');

export type SmtpEmailConfiguration = {
  host: string;
  port: number;
  secure: boolean;
  requireTls: boolean;
  rejectUnauthorized: boolean;
  from: string;
  user?: string;
  password?: string;
  verifyOnStartup: boolean;
  connectionTimeoutMs: number;
  greetingTimeoutMs: number;
  socketTimeoutMs: number;
};

export function createSmtpTransportOptions(
  config: SmtpEmailConfiguration,
): SMTPPool.Options {
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: config.requireTls,
    ...(config.user && config.password
      ? { auth: { user: config.user, pass: config.password } }
      : {}),
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: config.rejectUnauthorized,
      ...(isIP(config.host) === 0 ? { servername: config.host } : {}),
    },
    connectionTimeout: config.connectionTimeoutMs,
    greetingTimeout: config.greetingTimeoutMs,
    socketTimeout: config.socketTimeoutMs,
    disableFileAccess: true,
    disableUrlAccess: true,
  };
}
