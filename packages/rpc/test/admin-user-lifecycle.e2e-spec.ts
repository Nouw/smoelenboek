import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { DataSource, type EntityManager } from 'typeorm';

import { DeregisterManagedUserCommand, ReactivateManagedUserCommand } from '../src/users/commands/admin-user.commands';
import { DeregisterManagedUserHandler, ReactivateManagedUserHandler } from '../src/users/commands/admin-user-lifecycle.handlers';
import { EmailOutboxRepository } from '../src/email/email-outbox.repository';
import { getLocalDate, getSeasonKey } from '../src/seasons/season-policy';
import { assertActiveUserForAssignment } from '../src/users/user-assignment-access';

// eslint-disable-next-line turbo/no-undeclared-env-vars
const databaseUrl = process.env.TEST_USER_LIFECYCLE_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;
const actorId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const targetId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const currentTeamId = '11111111-1111-4111-8111-111111111111';
const priorTeamId = '22222222-2222-4222-8222-222222222222';
const currentCommitteeId = '33333333-3333-4333-8333-333333333333';
const priorCommitteeId = '44444444-4444-4444-8444-444444444444';

type AuditEvent = {
  eventType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  metadata: { actorUserId: string };
};

describeWithDatabase('admin user lifecycle PostgreSQL transaction', () => {
  let dataSource: DataSource;
  let tablesCreated = false;

  beforeAll(async () => {
    if (!databaseUrl) throw new Error('TEST_USER_LIFECYCLE_DATABASE_URL is required.');
    const name = decodeURIComponent(new URL(databaseUrl).pathname.slice(1));
    if (name !== 'user_lifecycle_test') {
      throw new Error('Lifecycle test requires a dedicated database named user_lifecycle_test.');
    }
    dataSource = new DataSource({ type: 'postgres', url: databaseUrl });
    await dataSource.initialize();
    const existing = await dataSource.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    ) as Array<{ tablename: string }>;
    if (existing.length) {
      throw new Error(`Lifecycle test database must be empty; found ${existing.map(({ tablename }) => tablename).join(', ')}.`);
    }
    await dataSource.transaction((manager) => createFixtureTables(manager));
    tablesCreated = true;
  });

  afterAll(async () => {
    if (!dataSource?.isInitialized) return;
    if (tablesCreated) {
      await dataSource.query(`DROP TABLE lifecycle_audit, predictions, poll_responses, email_outbox, verification, apikey, "session", committee_memberships, team_memberships, user_information, users`);
    }
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await seedFixture(dataSource);
  });

  it('deregisters and reactivates in real transactions, preserving historical rows', async () => {
    const publisher = transactionalPublisher(dataSource);
    const deregister = new DeregisterManagedUserHandler(
      publisher as never, new EmailOutboxRepository(dataSource),
    );
    const reactivate = new ReactivateManagedUserHandler(publisher as never, {
      queueReactivationInvitation: async () => { throw new Error('Activated accounts need no invitation.'); },
    } as never);

    await expect(deregister.execute(new DeregisterManagedUserCommand(actorId, targetId)))
      .resolves.toEqual({ userId: targetId, leaveDate: getLocalDate(new Date()), role: 'user' });

    const [user] = await dataSource.query(`SELECT "role", "banned", "banReason" FROM users WHERE id = $1`, [targetId]);
    expect(user).toMatchObject({ role: 'user', banned: true, banReason: 'membership ended' });
    const [information] = await dataSource.query(`SELECT "leaveDate" FROM user_information WHERE "userId" = $1`, [targetId]);
    expect(getLocalDate(information.leaveDate)).toBe(getLocalDate(new Date()));
    await expect(dataSource.transaction((manager) => assertActiveUserForAssignment(manager, targetId)))
      .rejects.toThrow('Inactive users cannot be assigned.');
    expect(await dataSource.query(`SELECT id FROM "session" WHERE "userId" = $1`, [targetId])).toHaveLength(0);
    expect(await dataSource.query(`SELECT enabled FROM apikey WHERE "referenceId" = $1`, [targetId]))
      .toEqual([expect.objectContaining({ enabled: false })]);
    expect(await dataSource.query(`SELECT identifier FROM verification WHERE value = $1 ORDER BY identifier`, [targetId]))
      .toEqual([{ identifier: 'email-verification:keep' }]);
    expect(await dataSource.query(`SELECT "messageType", status FROM email_outbox WHERE "relatedUserId" = $1 ORDER BY "messageType"`, [targetId]))
      .toEqual([
        { messageType: 'address_update', status: 'pending' },
        { messageType: 'invitation', status: 'cancelled' },
        { messageType: 'password_reset', status: 'cancelled' },
      ]);
    expect(await dataSource.query(`SELECT id FROM team_memberships WHERE "userId" = $1`, [targetId]))
      .toEqual([{ id: priorTeamId }]);
    expect(await dataSource.query(`SELECT id FROM committee_memberships WHERE "userId" = $1`, [targetId]))
      .toEqual([{ id: priorCommitteeId }]);
    expect(await dataSource.query(`SELECT "userId" FROM poll_responses WHERE "userId" = $1`, [targetId]))
      .toHaveLength(1);
    expect(await dataSource.query(`SELECT "userId" FROM predictions WHERE "userId" = $1`, [targetId]))
      .toHaveLength(1);

    const events = await dataSource.query(`SELECT "eventType", "aggregateId", payload, metadata FROM lifecycle_audit ORDER BY id`) as AuditEvent[];
    expect(events.map((event) => event.eventType)).toEqual([
      'team.member_removed', 'committee.member_removed', 'user.role_changed', 'user.membership_status_changed',
    ]);
    expect(events.map((event) => event.aggregateId)).toEqual([currentTeamId, currentCommitteeId, targetId, targetId]);
    for (const event of events) expect(event.metadata.actorUserId).toBe(actorId);

    await expect(reactivate.execute(new ReactivateManagedUserCommand(actorId, targetId)))
      .resolves.toEqual({ userId: targetId, leaveDate: null, role: 'user' });
    await expect(dataSource.transaction((manager) => assertActiveUserForAssignment(manager, targetId)))
      .resolves.toBeUndefined();
    expect(await dataSource.query(`SELECT "role", "banned", "banReason" FROM users WHERE id = $1`, [targetId]))
      .toEqual([{ role: 'user', banned: false, banReason: null }]);
    expect(await dataSource.query(`SELECT "leaveDate" FROM user_information WHERE "userId" = $1`, [targetId]))
      .toEqual([{ leaveDate: null }]);
    expect(await dataSource.query(`SELECT id FROM team_memberships WHERE "userId" = $1`, [targetId]))
      .toEqual([{ id: priorTeamId }]);
    expect(await dataSource.query(`SELECT id FROM committee_memberships WHERE "userId" = $1`, [targetId]))
      .toEqual([{ id: priorCommitteeId }]);
    expect(await dataSource.query(`SELECT enabled FROM apikey WHERE "referenceId" = $1`, [targetId]))
      .toEqual([{ enabled: false }]);
    const auditAfterReactivate = await dataSource.query(`SELECT "eventType", metadata FROM lifecycle_audit ORDER BY id`) as AuditEvent[];
    expect(auditAfterReactivate).toHaveLength(5);
    expect(auditAfterReactivate[4]).toMatchObject({
      eventType: 'user.membership_status_changed', metadata: { actorUserId: actorId },
    });
  });

  it('rolls back every write when outbox cancellation fails', async () => {
    const before = await snapshot(dataSource);
    const deregister = new DeregisterManagedUserHandler(transactionalPublisher(dataSource) as never, {
      cancelPendingAccessMessages: async () => { throw new Error('outbox unavailable'); },
    } as never);

    await expect(deregister.execute(new DeregisterManagedUserCommand(actorId, targetId)))
      .rejects.toThrow('outbox unavailable');
    expect(await snapshot(dataSource)).toEqual(before);
    expect(await dataSource.query(`SELECT id FROM lifecycle_audit`)).toHaveLength(0);
  });

  it('clears a pre-existing independent ban when membership is restored', async () => {
    await dataSource.query(`UPDATE users SET banned = true, "banReason" = 'independent ban' WHERE id = $1`, [targetId]);
    const publisher = transactionalPublisher(dataSource);
    const deregister = new DeregisterManagedUserHandler(publisher as never, new EmailOutboxRepository(dataSource));
    const reactivate = new ReactivateManagedUserHandler(publisher as never, {
      queueReactivationInvitation: async () => { throw new Error('Activated accounts need no invitation.'); },
    } as never);

    await deregister.execute(new DeregisterManagedUserCommand(actorId, targetId));
    expect(await dataSource.query(`SELECT banned, "banReason" FROM users WHERE id = $1`, [targetId]))
      .toEqual([{ banned: true, banReason: 'independent ban' }]);
    await reactivate.execute(new ReactivateManagedUserCommand(actorId, targetId));
    expect(await dataSource.query(`SELECT banned, "banReason" FROM users WHERE id = $1`, [targetId]))
      .toEqual([{ banned: false, banReason: null }]);
  });
});

function transactionalPublisher(dataSource: DataSource) {
  return {
    appendPreparedBatchAndPublish: async (
      prepare: (manager: EntityManager) => Promise<AuditEvent[]>,
    ) => dataSource.transaction(async (manager) => {
      const events = await prepare(manager);
      for (const event of events) {
        await manager.query(
          `INSERT INTO lifecycle_audit ("eventType", "aggregateId", payload, metadata) VALUES ($1, $2, $3::jsonb, $4::jsonb)`,
          [event.eventType, event.aggregateId, JSON.stringify(event.payload), JSON.stringify(event.metadata)],
        );
      }
      return [];
    }),
  };
}

async function snapshot(dataSource: DataSource) {
  const tables = ['users', 'user_information', 'team_memberships', 'committee_memberships', 'session', 'apikey', 'verification', 'email_outbox', 'poll_responses', 'predictions'];
  return Promise.all(tables.map(async (table) => ({
    table,
    rows: await dataSource.query(`SELECT * FROM "${table}" ORDER BY 1`),
  })));
}

async function createFixtureTables(manager: EntityManager): Promise<void> {
  await manager.query(`CREATE TABLE users (id uuid PRIMARY KEY, email text, name text NOT NULL, "preferredLocale" text NOT NULL, role text NOT NULL, "accountActivatedAt" timestamptz, banned boolean NOT NULL DEFAULT false, "banReason" text, "banExpires" timestamptz, "updatedAt" timestamptz NOT NULL DEFAULT now())`);
  await manager.query(`CREATE TABLE user_information ("userId" uuid PRIMARY KEY, "leaveDate" date, "updatedAt" timestamptz NOT NULL DEFAULT now())`);
  await manager.query(`CREATE TABLE team_memberships (id uuid PRIMARY KEY, "userId" uuid NOT NULL, "seasonKey" int NOT NULL, "endedOn" date)`);
  await manager.query(`CREATE TABLE committee_memberships (id uuid PRIMARY KEY, "userId" uuid NOT NULL, "seasonKey" int NOT NULL, "endedOn" date)`);
  await manager.query(`CREATE TABLE "session" (id text PRIMARY KEY, "userId" uuid NOT NULL)`);
  await manager.query(`CREATE TABLE apikey (id text PRIMARY KEY, "referenceId" uuid NOT NULL, enabled boolean NOT NULL, "updatedAt" timestamptz NOT NULL DEFAULT now())`);
  await manager.query(`CREATE TABLE verification (identifier text PRIMARY KEY, value text NOT NULL)`);
  await manager.query(`CREATE TABLE email_outbox (id text PRIMARY KEY, "relatedUserId" uuid NOT NULL, "messageType" text NOT NULL, status text NOT NULL, "updatedAt" timestamptz NOT NULL DEFAULT now())`);
  await manager.query(`CREATE TABLE poll_responses (id text PRIMARY KEY, "userId" uuid NOT NULL)`);
  await manager.query(`CREATE TABLE predictions (id text PRIMARY KEY, "userId" uuid NOT NULL)`);
  await manager.query(`CREATE TABLE lifecycle_audit (id bigserial PRIMARY KEY, "eventType" text NOT NULL, "aggregateId" text NOT NULL, payload jsonb NOT NULL, metadata jsonb NOT NULL)`);
}

async function seedFixture(dataSource: DataSource): Promise<void> {
  await dataSource.query(`TRUNCATE lifecycle_audit, predictions, poll_responses, email_outbox, verification, apikey, "session", committee_memberships, team_memberships, user_information, users RESTART IDENTITY`);
  await dataSource.query(`INSERT INTO users (id, email, name, "preferredLocale", role, "accountActivatedAt") VALUES ($1, 'admin@example.com', 'Admin', 'en', 'admin', now()), ($2, 'member@example.com', 'Member', 'nl', 'admin', now())`, [actorId, targetId]);
  await dataSource.query(`INSERT INTO user_information ("userId") VALUES ($1), ($2)`, [actorId, targetId]);
  const season = getSeasonKey(new Date());
  await dataSource.query(`INSERT INTO team_memberships (id, "userId", "seasonKey") VALUES ($1, $3, $4), ($2, $3, $5)`, [currentTeamId, priorTeamId, targetId, season, season - 1]);
  await dataSource.query(`INSERT INTO committee_memberships (id, "userId", "seasonKey") VALUES ($1, $3, $4), ($2, $3, $5)`, [currentCommitteeId, priorCommitteeId, targetId, season, season - 1]);
  await dataSource.query(`INSERT INTO "session" (id, "userId") VALUES ('session-1', $1)`, [targetId]);
  await dataSource.query(`INSERT INTO apikey (id, "referenceId", enabled) VALUES ('key-1', $1, true)`, [targetId]);
  await dataSource.query(`INSERT INTO verification (identifier, value) VALUES ('reset-password:one', $1), ('email-verification:keep', $1)`, [targetId]);
  await dataSource.query(`INSERT INTO email_outbox (id, "relatedUserId", "messageType", status) VALUES ('invite', $1, 'invitation', 'pending'), ('reset', $1, 'password_reset', 'sending'), ('address', $1, 'address_update', 'pending')`, [targetId]);
  await dataSource.query(`INSERT INTO poll_responses (id, "userId") VALUES ('response-1', $1)`, [targetId]);
  await dataSource.query(`INSERT INTO predictions (id, "userId") VALUES ('prediction-1', $1)`, [targetId]);
}
