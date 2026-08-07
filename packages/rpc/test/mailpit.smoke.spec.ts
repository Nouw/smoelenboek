import { describe, expect, it } from '@jest/globals';
import { EmailOutboxEntity } from '../src/email/entities/email-outbox.entity';
import { SmtpEmailSender } from '../src/email/smtp-email.sender';

const run = process.env.RUN_MAILPIT_SMOKE === '1' ? describe : describe.skip;

run('external Mailpit smoke', () => {
  it('delivers localized HTML and plain text through the configured machine service', async () => {
    const recipient = `codex-smoke-${Date.now()}@example.test`;
    await new SmtpEmailSender().send(Object.assign(new EmailOutboxEntity(), {
      messageType: 'invitation', recipient, locale: 'en', payload: { name: 'Smoke Member', url: 'http://localhost:3002/api/auth/reset-password/smoke-token' },
    }));
    const baseUrl = process.env.MAILPIT_HTTP_URL ?? 'http://127.0.0.1:8025';
    const response = await fetch(`${baseUrl}/api/v1/search?query=to:${encodeURIComponent(recipient)}`);
    expect(response.ok).toBe(true);
    const body = await response.json() as { messages: Array<{ Subject: string; To: Array<{ Address: string }> }> };
    expect(body.messages.some((message) => message.Subject === 'Activate your Smoelenboek account' && message.To.some((to) => to.Address === recipient))).toBe(true);
  });
});
