import { describe, expect, it } from '@jest/globals';

import { createSmtpTransportOptions } from './smtp-email.config';

describe('createSmtpTransportOptions', () => {
  it('configures authenticated STARTTLS with certificate verification', () => {
    expect(
      createSmtpTransportOptions({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        requireTls: true,
        rejectUnauthorized: true,
        from: 'Smoelenboek <members@example.com>',
        user: 'smtp-user',
        password: 'smtp-password',
        verifyOnStartup: true,
        connectionTimeoutMs: 10_000,
        greetingTimeoutMs: 10_000,
        socketTimeoutMs: 60_000,
      }),
    ).toMatchObject({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { user: 'smtp-user', pass: 'smtp-password' },
      pool: true,
      tls: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true,
        servername: 'smtp.example.com',
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 60_000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  });

  it('supports local unauthenticated SMTP without weakening certificate defaults', () => {
    const options = createSmtpTransportOptions({
      host: '127.0.0.1',
      port: 1025,
      secure: false,
      requireTls: false,
      rejectUnauthorized: true,
      from: 'Smoelenboek <noreply@smoelenboek.local>',
      verifyOnStartup: false,
      connectionTimeoutMs: 10_000,
      greetingTimeoutMs: 10_000,
      socketTimeoutMs: 60_000,
    });

    expect(options).not.toHaveProperty('auth');
    expect(options.tls).toMatchObject({
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    });
    expect(options.tls).not.toHaveProperty('servername');
  });
});
