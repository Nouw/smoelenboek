import { describe, expect, it, jest } from '@jest/globals';

import { UserRoleChangedEvent } from '../events/user-role-changed.event';
import { SetManagedUserRoleCommand } from './admin-user.commands';
import { SetManagedUserRoleHandler } from './admin-user.handlers';

const actorUserId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const targetUserId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('SetManagedUserRoleHandler', () => {
  it('grants administrator rights atomically and records the actor', async () => {
    const { handler, manager, published } = harness([
      [
        { id: actorUserId, role: 'admin' },
        { id: targetUserId, role: 'user' },
      ],
    ]);

    await expect(
      handler.execute(
        new SetManagedUserRoleCommand(actorUserId, targetUserId, 'admin'),
      ),
    ).resolves.toEqual({ userId: targetUserId, role: 'admin' });

    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('pg_advisory_xact_lock'),
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE "users" SET "role"'),
      [targetUserId, 'admin'],
    );
    expect(published[0]).toBeInstanceOf(UserRoleChangedEvent);
    expect(published[0]).toMatchObject({
      payload: { userId: targetUserId, role: 'admin' },
      metadata: { source: 'admin', actorUserId },
    });
  });

  it('revokes administrator rights when another administrator remains', async () => {
    const { handler, manager } = harness([
      [
        { id: actorUserId, role: 'admin' },
        { id: targetUserId, role: 'admin' },
      ],
      [{ count: 2 }],
    ]);

    await expect(
      handler.execute(
        new SetManagedUserRoleCommand(actorUserId, targetUserId, 'user'),
      ),
    ).resolves.toEqual({ userId: targetUserId, role: 'user' });
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE "users" SET "role"'),
      [targetUserId, 'user'],
    );
  });

  it('rejects self-revocation before changing the role', async () => {
    const { handler, manager } = harness([
      [{ id: actorUserId, role: 'admin' }],
    ]);

    await expect(
      handler.execute(
        new SetManagedUserRoleCommand(actorUserId, actorUserId, 'user'),
      ),
    ).rejects.toThrow(
      'Administrators cannot revoke their own administrator rights.',
    );
    expect(updateCalls(manager.query)).toHaveLength(0);
  });

  it('rejects revoking the final administrator', async () => {
    const { handler, manager } = harness([
      [
        { id: actorUserId, role: 'admin' },
        { id: targetUserId, role: 'admin' },
      ],
      [{ count: 1 }],
    ]);

    await expect(
      handler.execute(
        new SetManagedUserRoleCommand(actorUserId, targetUserId, 'user'),
      ),
    ).rejects.toThrow('The final administrator cannot be revoked.');
    expect(updateCalls(manager.query)).toHaveLength(0);
  });

  it('rejects a stale request after the actor has lost administrator rights', async () => {
    const { handler, manager } = harness([
      [
        { id: actorUserId, role: 'user' },
        { id: targetUserId, role: 'admin' },
      ],
    ]);

    await expect(
      handler.execute(
        new SetManagedUserRoleCommand(actorUserId, targetUserId, 'user'),
      ),
    ).rejects.toThrow('Administrator access is required.');
    expect(updateCalls(manager.query)).toHaveLength(0);
  });

  it('rejects an unknown target user', async () => {
    const { handler } = harness([
      [{ id: actorUserId, role: 'admin' }],
    ]);

    await expect(
      handler.execute(
        new SetManagedUserRoleCommand(actorUserId, targetUserId, 'admin'),
      ),
    ).rejects.toThrow('User not found.');
  });
});

function harness(queryResults: unknown[][]) {
  let resultIndex = 0;
  const manager = {
    query: jest.fn(async (sql: string) => {
      if (sql.includes('pg_advisory_xact_lock')) return [];
      if (sql.includes('UPDATE "users"')) return [];
      return queryResults[resultIndex++] ?? [];
    }),
  };
  const published: UserRoleChangedEvent[] = [];
  const publisher = {
    appendPreparedAndPublish: jest.fn(
      async (prepare: (value: typeof manager) => Promise<UserRoleChangedEvent>) => {
        published.push(await prepare(manager));
        return { stored: {}, dispatched: true };
      },
    ),
  };

  return {
    handler: new SetManagedUserRoleHandler(publisher as never),
    manager,
    published,
  };
}

function updateCalls(query: jest.Mock) {
  return query.mock.calls.filter(([sql]) =>
    String(sql).includes('UPDATE "users"'),
  );
}
