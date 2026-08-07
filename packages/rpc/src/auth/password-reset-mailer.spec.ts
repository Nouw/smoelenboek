import { describe, expect, it, jest } from '@jest/globals';

import { createConsolePasswordResetMailer, createOutboxPasswordResetMailer } from './password-reset-mailer';

describe('createConsolePasswordResetMailer', () => {
  it('delegates reset delivery to the replaceable logger adapter', async () => {
    const info = jest.fn();
    const mailer = createConsolePasswordResetMailer({ info });

    await mailer.send({
      user: { id: 'user-id', email: 'member@example.com', name: 'Member' },
      url: 'https://auth.example.com/reset-password/token',
      token: 'secret-token',
    });

    expect(info).toHaveBeenCalledWith(
      expect.stringContaining('To: member@example.com'),
    );
    expect(info).toHaveBeenCalledWith(
      expect.stringContaining('https://auth.example.com/reset-password/token'),
    );
  });
});

describe('createOutboxPasswordResetMailer', () => {
  it('queues localized semantic payload without logging a token', async () => {
    const query = jest.fn()
      .mockResolvedValueOnce({ rows: [{ preferredLocale: 'en' }] })
      .mockResolvedValueOnce({ rows: [] });
    await createOutboxPasswordResetMailer({ query } as never).send({
      user: { id: '42a83db7-cd8c-4878-bf0c-67989fce8cba', email: 'MEMBER@example.com', name: 'Member' },
      url: 'https://auth.example.com/reset-password/token', token: 'secret-token',
    });
    expect(query).toHaveBeenLastCalledWith(expect.stringContaining('INSERT INTO "email_outbox"'), expect.arrayContaining(['password_reset', 'member@example.com', 'en']));
    expect(JSON.stringify(query.mock.calls)).not.toContain('secret-token');
  });
});
