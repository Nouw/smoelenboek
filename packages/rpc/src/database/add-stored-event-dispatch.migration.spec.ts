import { describe, expect, it, jest } from '@jest/globals';

import { AddStoredEventDispatch1769300000000 } from './migrations/1769300000000-AddStoredEventDispatch';

describe('AddStoredEventDispatch1769300000000', () => {
  it('adds dispatch bookkeeping columns, backfills legacy rows, and creates indexes', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new AddStoredEventDispatch1769300000000().up({ query } as never);
    const sql = query.mock.calls.map(([value]) => value).join('\n');
    expect(sql).toContain('"dispatchStatus"');
    expect(sql).toContain('"dispatchAttempts"');
    expect(sql).toContain('"nextDispatchAt"');
    expect(sql).toContain('"lastDispatchError"');
    expect(sql).toContain("'pending', 'dispatching', 'dispatched', 'failed'");
    expect(sql).toContain("SET \"dispatchStatus\" = 'dispatched'");
    expect(sql).toContain('IDX_stored_events_dispatch');
    expect(sql).toContain('IDX_stored_events_aggregate_sequence');
  });

  it('removes dispatch columns and indexes when reverted', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new AddStoredEventDispatch1769300000000().down({ query } as never);
    const sql = query.mock.calls.map(([value]) => value).join('\n');
    expect(sql).toContain('DROP INDEX "IDX_stored_events_dispatch"');
    expect(sql).toContain('DROP INDEX "IDX_stored_events_aggregate_sequence"');
    expect(sql).toContain('DROP COLUMN "dispatchStatus"');
  });
});
