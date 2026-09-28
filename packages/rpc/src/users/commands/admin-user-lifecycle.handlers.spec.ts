import { describe, expect, it, jest } from '@jest/globals';

import { CommitteeMemberRemovedEvent } from '../../committees/events/committee-events';
import { TeamMemberRemovedEvent } from '../../teams/events/team-events';
import { UserMembershipStatusChangedEvent } from '../events/user-membership-status-changed.event';
import { UserRoleChangedEvent } from '../events/user-role-changed.event';
import { DeregisterManagedUserCommand, ReactivateManagedUserCommand } from './admin-user.commands';
import { DeregisterManagedUserHandler, ReactivateManagedUserHandler } from './admin-user-lifecycle.handlers';

const actorUserId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const targetUserId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

type UserRow = {
  id: string;
  role: 'admin' | 'user';
  email: string | null;
  name: string;
  preferredLocale: 'nl' | 'en';
  accountActivatedAt: Date | null;
  banned: boolean;
  banReason: string | null;
  leaveDate: string | null;
};

const actor: UserRow = {
  id: actorUserId, role: 'admin', email: 'admin@example.com', name: 'Admin',
  preferredLocale: 'en', accountActivatedAt: new Date('2026-01-01T00:00:00Z'),
  banned: false, banReason: null, leaveDate: null,
};
const target: UserRow = {
  id: targetUserId, role: 'user', email: 'member@example.com', name: 'Member',
  preferredLocale: 'nl', accountActivatedAt: new Date('2026-01-01T00:00:00Z'),
  banned: false, banReason: null, leaveDate: null,
};

function harness(options: {
  actor?: Partial<UserRow> | null;
  target?: Partial<UserRow> | null;
  activeAdminCount?: number;
  teamIds?: string[];
  committeeIds?: string[];
} = {}) {
  const users = [
    options.actor === null ? null : { ...actor, ...options.actor },
    options.target === null ? null : { ...target, ...options.target },
  ].filter((row): row is UserRow => row !== null);
  const manager = {
    query: jest.fn(async (sql: string) => {
      if (sql.includes('WHERE u."id" IN')) return users;
      if (sql.includes('SELECT COUNT(*)')) return [{ count: options.activeAdminCount ?? 2 }];
      if (sql.includes('SELECT "id" FROM "team_memberships"')) return (options.teamIds ?? []).map((id) => ({ id }));
      if (sql.includes('SELECT "id" FROM "committee_memberships"')) return (options.committeeIds ?? []).map((id) => ({ id }));
      return [];
    }),
  };
  const preparedEvents: Array<
    TeamMemberRemovedEvent | CommitteeMemberRemovedEvent |
    UserRoleChangedEvent | UserMembershipStatusChangedEvent
  > = [];
  const publisher = {
    appendPreparedBatchAndPublish: jest.fn(async (prepare: (manager: typeof manager) => Promise<typeof preparedEvents>) => {
      preparedEvents.push(...await prepare(manager));
      return [];
    }),
  };
  const outbox = { cancelPendingAccessMessages: jest.fn(async () => undefined) };
  const provisioning = { queueReactivationInvitation: jest.fn(async () => undefined) };
  return {
    manager, publisher, outbox, provisioning, preparedEvents,
    deregister: new DeregisterManagedUserHandler(publisher as never, outbox as never),
    reactivate: new ReactivateManagedUserHandler(publisher as never, provisioning as never),
  };
}

function sqlCalls(manager: ReturnType<typeof harness>['manager']): string[] {
  return manager.query.mock.calls.map(([sql]) => sql);
}

describe('DeregisterManagedUserHandler', () => {
  it('ends access and assignments in the prepared transaction, retaining historical data', async () => {
    const h = harness({
      target: { role: 'admin' }, teamIds: ['team-membership-1'],
      committeeIds: ['committee-membership-1'],
    });

    await expect(h.deregister.execute(new DeregisterManagedUserCommand(actorUserId, targetUserId)))
      .resolves.toMatchObject({ userId: targetUserId, role: 'user', leaveDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) });

    const queries = sqlCalls(h.manager);
    expect(queries[0]).toContain('pg_advisory_xact_lock');
    expect(queries).toEqual(expect.arrayContaining([
      expect.stringContaining('INSERT INTO "user_information"'),
      expect.stringContaining('UPDATE "users" SET "role" = \'user\', "banned" = true'),
      expect.stringContaining('DELETE FROM "session"'),
      expect.stringContaining('UPDATE "apikey" SET "enabled" = false'),
      expect.stringContaining('DELETE FROM "verification"'),
      expect.stringContaining('DELETE FROM "team_memberships"'),
      expect.stringContaining('DELETE FROM "committee_memberships"'),
    ]));
    for (const table of ['team_memberships', 'committee_memberships']) {
      const selected = queries.find((sql) => sql.includes(`SELECT "id" FROM "${table}"`));
      const deleted = queries.find((sql) => sql.includes(`DELETE FROM "${table}"`));
      expect(selected).toContain('"seasonKey" >= $2 AND "endedOn" IS NULL');
      expect(deleted).toContain('"seasonKey" >= $2 AND "endedOn" IS NULL');
      expect(h.manager.query).toHaveBeenCalledWith(
        expect.stringContaining(`DELETE FROM "${table}"`),
        [targetUserId, expect.any(Number)],
      );
    }
    expect(h.outbox.cancelPendingAccessMessages).toHaveBeenCalledWith(targetUserId, h.manager);
    expect(queries.join('\n')).not.toMatch(/(?:DELETE|UPDATE)\s+(?:FROM\s+)?"(?:poll_responses|predictions|users)"\s+WHERE/i);

    expect(h.preparedEvents).toHaveLength(4);
    expect(h.preparedEvents[0]).toBeInstanceOf(TeamMemberRemovedEvent);
    expect(h.preparedEvents[1]).toBeInstanceOf(CommitteeMemberRemovedEvent);
    expect(h.preparedEvents[2]).toBeInstanceOf(UserRoleChangedEvent);
    expect(h.preparedEvents[3]).toBeInstanceOf(UserMembershipStatusChangedEvent);
    expect(h.preparedEvents).toEqual(expect.arrayContaining([
      expect.objectContaining({ payload: { membershipId: 'team-membership-1' } }),
      expect.objectContaining({ payload: { membershipId: 'committee-membership-1' } }),
      expect.objectContaining({ payload: { userId: targetUserId, role: 'user' } }),
      expect.objectContaining({ payload: { userId: targetUserId, leaveDate: expect.any(String) } }),
    ]));
    for (const event of h.preparedEvents) expect(event.metadata.actorUserId).toBe(actorUserId);
  });

  it.each([
    ['non-admin', { role: 'user' }],
    ['inactive admin', { leaveDate: '2026-01-01' }],
    ['banned admin', { banned: true }],
  ] as const)('rejects a %s actor before changing data', async (_label, actorOverride) => {
    const h = harness({ actor: actorOverride });
    await expect(h.deregister.execute(new DeregisterManagedUserCommand(actorUserId, targetUserId)))
      .rejects.toThrow('Active administrator access required.');
    expect(sqlCalls(h.manager)).not.toEqual(expect.arrayContaining([expect.stringContaining('UPDATE "users"')]));
    expect(h.preparedEvents).toHaveLength(0);
  });

  it('rejects self-deregistration and the final active admin', async () => {
    const self = harness({ target: null });
    await expect(self.deregister.execute(new DeregisterManagedUserCommand(actorUserId, actorUserId)))
      .rejects.toThrow('Administrators cannot deregister themselves.');
    expect(self.preparedEvents).toHaveLength(0);

    const finalAdmin = harness({ target: { role: 'admin' }, activeAdminCount: 1 });
    await expect(finalAdmin.deregister.execute(new DeregisterManagedUserCommand(actorUserId, targetUserId)))
      .rejects.toThrow('The final active administrator cannot be deregistered.');
    expect(sqlCalls(finalAdmin.manager)).not.toEqual(expect.arrayContaining([expect.stringContaining('UPDATE "users"')]));
  });

  it('does not publish events when preparation fails, leaving rollback to the transaction', async () => {
    const h = harness({ teamIds: ['team-membership-1'] });
    h.outbox.cancelPendingAccessMessages.mockRejectedValueOnce(new Error('outbox failure'));
    await expect(h.deregister.execute(new DeregisterManagedUserCommand(actorUserId, targetUserId)))
      .rejects.toThrow('outbox failure');
    expect(h.publisher.appendPreparedBatchAndPublish).toHaveBeenCalledTimes(1);
    expect(h.preparedEvents).toHaveLength(0);
  });
});

describe('ReactivateManagedUserHandler', () => {
  it('restores a regular account without restoring assignments or API keys', async () => {
    const h = harness({ target: { leaveDate: '2026-09-01', banned: true, banReason: 'membership ended' } });
    await expect(h.reactivate.execute(new ReactivateManagedUserCommand(actorUserId, targetUserId)))
      .resolves.toEqual({ userId: targetUserId, role: 'user', leaveDate: null });
    const queries = sqlCalls(h.manager);
    expect(queries).toEqual(expect.arrayContaining([
      expect.stringContaining('UPDATE "user_information" SET "leaveDate" = NULL'),
      expect.stringContaining('UPDATE "users" SET "role" = \'user\', "banned" = false'),
    ]));
    expect(queries.join('\n')).not.toMatch(/(?:INSERT INTO|UPDATE|DELETE FROM) "(?:team_memberships|committee_memberships|apikey)"/);
    expect(h.provisioning.queueReactivationInvitation).not.toHaveBeenCalled();
    expect(h.preparedEvents).toEqual([
      expect.objectContaining({ payload: { userId: targetUserId, leaveDate: null }, metadata: { source: 'admin', actorUserId } }),
    ]);
  });

  it('sends a fresh invitation if the prior account was never activated', async () => {
    const h = harness({ target: { leaveDate: '2026-09-01', banned: true, banReason: 'membership ended', accountActivatedAt: null } });
    await h.reactivate.execute(new ReactivateManagedUserCommand(actorUserId, targetUserId));
    expect(h.provisioning.queueReactivationInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ id: targetUserId, email: 'member@example.com', preferredLocale: 'nl' }), h.manager,
    );
  });

  it('lifts independent bans but rejects already active accounts', async () => {
    const banned = harness({ target: { leaveDate: '2026-09-01', banned: true, banReason: 'abuse' } });
    await expect(banned.reactivate.execute(new ReactivateManagedUserCommand(actorUserId, targetUserId)))
      .resolves.toEqual({ userId: targetUserId, leaveDate: null, role: 'user' });
    expect(banned.preparedEvents).toHaveLength(1);

    const active = harness();
    await expect(active.reactivate.execute(new ReactivateManagedUserCommand(actorUserId, targetUserId)))
      .rejects.toThrow('User is already active.');
    expect(active.preparedEvents).toHaveLength(0);
  });
});
