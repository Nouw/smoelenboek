import { describe, expect, it } from '@jest/globals';
import { renderEmail } from './email-templates';

describe('email templates', () => {
  it.each([
    ['nl', 'Activeer je Smoelenboek-account', 'Wachtwoord instellen'],
    ['en', 'Activate your Smoelenboek account', 'Set password'],
  ] as const)('renders an accessible localized invitation in %s', async (locale, subject, action) => {
    const email = await renderEmail('invitation', locale, { name: '<Member>', url: 'https://example.test/reset?token=secret' });
    expect(email.subject).toBe(subject);
    expect(email.html).toContain(action);
    expect(email.html).toContain('&lt;Member&gt;');
    expect(email.html).toContain('https://example.test/reset?token=secret');
    expect(email.text).toContain(action);
  });
});
