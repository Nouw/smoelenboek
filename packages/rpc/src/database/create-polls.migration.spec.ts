import { describe, expect, it, jest } from '@jest/globals';

import { CreatePolls1769100000000 } from './migrations/1769100000000-CreatePolls';

describe('CreatePolls1769100000000', () => {
  it('creates constrained poll, option, response, and selection tables', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new CreatePolls1769100000000().up({ query } as never);
    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    for (const table of [
      'polls',
      'poll_options',
      'poll_responses',
      'poll_selections',
    ]) {
      expect(sql).toContain(`CREATE TABLE "${table}"`);
    }
    expect(sql).toContain('CHK_polls_choice_mode');
    expect(sql).toContain('CHK_polls_dates');
    expect(sql).toContain('UQ_poll_responses_user');
    expect(sql).toContain('UQ_poll_selections_option');
    expect(sql).toContain('ON DELETE CASCADE');
  });

  it('drops objects in reverse dependency order', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new CreatePolls1769100000000().down({ query } as never);
    const statements = query.mock.calls.map(([statement]) => statement);
    expect(statements.indexOf('DROP TABLE "poll_selections"')).toBeLessThan(
      statements.indexOf('DROP TABLE "poll_responses"'),
    );
    expect(statements.at(-1)).toBe('DROP TABLE "polls"');
  });
});
