import { describe, expect, it, jest } from '@jest/globals';

import { AddLegacyPasswordMigrationState1769700000000 } from './migrations/1769700000000-AddLegacyPasswordMigrationState';

describe('AddLegacyPasswordMigrationState1769700000000', () => {
  it('adds only the durable legacy-password state to users', async () => {
    const query = jest.fn().mockResolvedValue(undefined);

    await new AddLegacyPasswordMigrationState1769700000000().up({
      query,
    } as never);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain(
      '"passwordMigrationRequired" boolean NOT NULL DEFAULT false',
    );
    expect(sql).toContain(
      '"passwordMigrationResetSentAt" TIMESTAMP WITH TIME ZONE',
    );
    expect(sql).toContain('UPDATE "users" users');
    expect(sql).toContain('account."providerId" = \'credential\'');
    expect(sql).toContain('account."password" = \'reset\'');
    expect(sql).toContain('account."password" ~ \'^[$]2[aby][$][0-9]{2}[$]\'');
    expect(sql).not.toContain('legacy_user_migration_map');
  });

  it('removes the legacy-password state when reverted', async () => {
    const query = jest.fn().mockResolvedValue(undefined);

    await new AddLegacyPasswordMigrationState1769700000000().down({
      query,
    } as never);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain(
      'DROP COLUMN IF EXISTS "passwordMigrationResetSentAt"',
    );
    expect(sql).toContain('DROP COLUMN IF EXISTS "passwordMigrationRequired"');
  });
});
