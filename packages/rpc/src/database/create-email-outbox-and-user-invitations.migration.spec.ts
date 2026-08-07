import { describe, expect, it, jest } from '@jest/globals';

import { CreateEmailOutboxAndUserInvitations1769000000000 } from './migrations/1769000000000-CreateEmailOutboxAndUserInvitations';

describe('CreateEmailOutboxAndUserInvitations1769000000000', () => {
  it('adds localized activation tracking and a constrained durable outbox', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new CreateEmailOutboxAndUserInvitations1769000000000().up({ query } as never);
    const sql = query.mock.calls.map(([value]) => value).join('\n');
    expect(sql).toContain('"preferredLocale"');
    expect(sql).toContain('"accountActivatedAt"');
    expect(sql).toContain('CREATE TABLE "email_outbox"');
    expect(sql).toContain('UNIQUE ("deduplicationKey")');
    expect(sql).toContain("'pending', 'sending', 'sent', 'failed'");
  });
});
