import { describe, expect, it, jest } from '@jest/globals';
import { DropUserInformationJoinDate1769200000000 } from './migrations/1769200000000-DropUserInformationJoinDate';

describe('DropUserInformationJoinDate1769200000000', () => {
  it('removes the duplicate membership start date and its old constraint', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new DropUserInformationJoinDate1769200000000().up({ query } as never);
    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('DROP COLUMN "joinDate"');
  });

  it('restores the legacy column from user creation time when reverted', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new DropUserInformationJoinDate1769200000000().down({ query } as never);
    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('ADD COLUMN "joinDate" date');
    expect(sql).toContain('users."createdAt"::date');
  });
});
