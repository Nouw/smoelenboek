import { describe, expect, it, jest } from '@jest/globals';

import { CreateUserInformation1768000000000 } from './migrations/1768000000000-CreateUserInformation';

describe('CreateUserInformation1768000000000', () => {
  it('creates a constrained one-to-one user information table', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new CreateUserInformation1768000000000();

    await migration.up({ query } as never);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('CREATE TABLE "user_information"');
    expect(sql).toContain('PRIMARY KEY ("userId")');
    expect(sql).toContain('UNIQUE ("bondNumber")');
    expect(sql).toContain('"leaveDate" >= "joinDate"');
    expect(sql).toContain('"backNumber" >= 0');
    expect(sql).toContain('REFERENCES "users"("id") ON DELETE CASCADE');
  });

  it('drops the table on rollback', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new CreateUserInformation1768000000000();

    await migration.down({ query } as never);

    expect(query).toHaveBeenCalledWith('DROP TABLE "user_information"');
  });
});
