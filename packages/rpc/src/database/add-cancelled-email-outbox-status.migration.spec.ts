import { describe, expect, it, jest } from '@jest/globals';
import { AddCancelledEmailOutboxStatus1769900000000 } from './migrations/1769900000000-AddCancelledEmailOutboxStatus';

describe('AddCancelledEmailOutboxStatus1769900000000', () => {
  it('allows cancelled outbox rows and reverses safely', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddCancelledEmailOutboxStatus1769900000000();
    await migration.up({ query } as never);
    const upSql = query.mock.calls.map(([sql]) => String(sql)).join('\n');
    expect(upSql).toContain("'cancelled'");
    expect(upSql).toContain('CHK_email_outbox_status');

    query.mockClear();
    await migration.down({ query } as never);
    const downSql = query.mock.calls.map(([sql]) => String(sql)).join('\n');
    expect(downSql).toContain("WHERE \"status\" = 'cancelled'");
    expect(downSql).toContain("'failed'");
  });
});
