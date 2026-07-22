import { describe, expect, it, jest } from '@jest/globals';

import { createConsolePasswordResetMailer } from './password-reset-mailer';

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
