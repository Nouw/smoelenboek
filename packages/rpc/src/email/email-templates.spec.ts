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

  it.each([
    ['nl', '[Smoelenboek] Adreswijziging', 'Teststraat 1, 1234AB Amsterdam'],
    ['en', '[Smoelenboek] Address update', 'Teststraat 1, 1234AB Amsterdam'],
  ] as const)('renders an address_update notification without a CTA button in %s', async (locale, subject, address) => {
    const email = await renderEmail('address_update', locale, { name: 'Test User', newAddress: address });
    expect(email.subject).toBe(subject);
    expect(email.html).toContain('Test User');
    expect(email.html).toContain(address);
    expect(email.html).not.toContain('If you did not request this');
    expect(email.html).not.toContain('Heb je dit niet aangevraagd');
  });

  it('throws for an unregistered email type', async () => {
    await expect(
      renderEmail('unknown_type' as never, 'nl', { name: 'x' }),
    ).rejects.toThrow('No renderer registered for email type: unknown_type');
  });
});
