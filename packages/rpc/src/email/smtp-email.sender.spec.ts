import { describe, expect, it, jest } from '@jest/globals';

import type { EmailOutboxEntity } from './entities/email-outbox.entity';
import type { SmtpEmailConfiguration } from './smtp-email.config';
import { SmtpEmailSender } from './smtp-email.sender';

const configuration: SmtpEmailConfiguration = {
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
};

describe('SmtpEmailSender', () => {
  it('verifies the authenticated SMTP connection during production startup', async () => {
    const transporter = {
      verify: jest.fn().mockResolvedValue(true),
      close: jest.fn(),
    };
    const sender = new SmtpEmailSender(configuration, transporter as never);

    await sender.onModuleInit();

    expect(transporter.verify).toHaveBeenCalledTimes(1);
  });

  it('fails startup without exposing an SMTP server response', async () => {
    const transporter = {
      verify: jest.fn().mockRejectedValue(
        Object.assign(new Error('535 password smtp-password rejected'), {
          code: 'EAUTH',
        }),
      ),
      close: jest.fn(),
    };
    const sender = new SmtpEmailSender(configuration, transporter as never);

    await expect(sender.onModuleInit()).rejects.toThrow(
      'SMTP startup verification failed (EAUTH).',
    );
    await expect(sender.onModuleInit()).rejects.not.toThrow('smtp-password');
  });

  it('skips startup verification for local Mailpit', async () => {
    const transporter = {
      verify: jest.fn(),
      close: jest.fn(),
    };
    const sender = new SmtpEmailSender(
      { ...configuration, verifyOnStartup: false },
      transporter as never,
    );

    await sender.onModuleInit();

    expect(transporter.verify).not.toHaveBeenCalled();
  });

  it('sends rendered mail from the validated sender and closes the pool', async () => {
    const transporter = {
      verify: jest.fn(),
      sendMail: jest.fn().mockResolvedValue({ messageId: 'message-1' }),
      close: jest.fn(),
    };
    const sender = new SmtpEmailSender(configuration, transporter as never);
    const message = {
      messageType: 'invitation',
      locale: 'en',
      recipient: 'member@example.com',
      payload: {
        name: 'Example Member',
        url: 'https://example.com/reset-password/token',
        expiresAt: '2026-08-12T10:00:00.000Z',
      },
    } as EmailOutboxEntity;

    await sender.send(message);
    sender.onModuleDestroy();

    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Smoelenboek <members@example.com>',
        to: 'member@example.com',
        subject: expect.any(String),
        html: expect.stringContaining(
          'https://example.com/reset-password/token',
        ),
        text: expect.stringContaining(
          'https://example.com/reset-password/token',
        ),
      }),
    );
    expect(transporter.close).toHaveBeenCalledTimes(1);
  });

  it('returns a sanitized delivery error to the durable outbox', async () => {
    const transporter = {
      verify: jest.fn(),
      sendMail: jest
        .fn()
        .mockRejectedValue(
          Object.assign(
            new Error('server leaked smtp-password for member@example.com'),
            { code: 'EAUTH' },
          ),
        ),
      close: jest.fn(),
    };
    const sender = new SmtpEmailSender(configuration, transporter as never);

    await expect(
      sender.send({
        messageType: 'password_reset',
        locale: 'en',
        recipient: 'member@example.com',
        payload: {
          name: 'Example Member',
          url: 'https://example.com/reset-password/token',
        },
      } as EmailOutboxEntity),
    ).rejects.toThrow('SMTP delivery failed (EAUTH).');
  });
});
