import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { DataSource } from 'typeorm';

import { getSeasonKey } from '../src/seasons/season-policy';
import { ACTOR, assertSnapshotLimit, reconcile, summarize } from './reconcile-inactive-users';

type Row = Record<string, unknown>;
type Tables = {
  users: Row[];
  user_information: Row[];
  session: Row[];
  apikey: Row[];
  verification: Row[];
  email_outbox: Row[];
  team_memberships: Row[];
  committee_memberships: Row[];
};

function fixture() {
  const userId = randomUUID();
  const seasonKey = getSeasonKey(new Date());
  const tables: Tables = {
    users: [{ id: userId, role: 'admin', banned: false, banReason: null }],
    user_information: [{ userId, leaveDate: '2025-08-31' }],
    session: [{ id: 'session-1', userId }],
    apikey: [{ id: 'key-1', referenceId: userId, enabled: true }],
    verification: [{ id: 'verify-1', value: userId, identifier: 'reset-password:abc' }],
    email_outbox: [{ id: 'mail-1', relatedUserId: userId, messageType: 'invitation', status: 'pending' }],
    team_memberships: [
      { id: randomUUID(), userId, seasonKey: seasonKey + 1, endedOn: null },
      { id: randomUUID(), userId, seasonKey: seasonKey - 2, endedOn: '2024-08-01' },
    ],
    committee_memberships: [{ id: randomUUID(), userId, seasonKey, endedOn: null }],
  };
  const events: Row[] = [];
  let failOn = '';
  const fakeManager = {
    async query(sql: string, params: unknown[] = []) {
      if (failOn && sql.includes(failOn)) throw new Error('injected DB failure');
      if (sql.includes('pg_advisory_xact_lock')) return [];
      if (sql.includes('SELECT u."id" FROM "users"')) return [{ id: userId }];
      const selected = sql.match(/SELECT \* FROM "([a-z_]+)"/);
      if (selected) {
        const table = selected[1] as keyof Tables;
        const key = table === 'users' ? 'id' : table === 'user_information' || table === 'session' || table.endsWith('_memberships') ? 'userId' : table === 'apikey' ? 'referenceId' : table === 'verification' ? 'value' : 'relatedUserId';
        return structuredClone(tables[table].filter((row) => (params[0] as string[]).includes(String(row[key])) && (!table.endsWith('_memberships') || (Number(row.seasonKey) >= Number(params[1]) && row.endedOn === null))));
      }
      if (sql.startsWith('UPDATE "users"')) {
        Object.assign(tables.users[0]!, { role: 'user', banned: true, banReason: 'membership ended' });
      } else if (sql.startsWith('DELETE FROM "session"')) tables.session = [];
      else if (sql.startsWith('UPDATE "apikey"')) tables.apikey[0]!.enabled = false;
      else if (sql.startsWith('DELETE FROM "verification"')) tables.verification = [];
      else if (sql.startsWith('UPDATE "email_outbox"')) tables.email_outbox[0]!.status = 'cancelled';
      else if (sql.startsWith('DELETE FROM "team_memberships"')) tables.team_memberships = tables.team_memberships.filter((row) => !(Number(row.seasonKey) >= Number(params[1]) && row.endedOn === null));
      else if (sql.startsWith('DELETE FROM "committee_memberships"')) tables.committee_memberships = [];
      else throw new Error(`Unexpected query: ${sql}`);
      return [];
    },
    getRepository() {
      return { create: (value: Row) => value, save: async (value: Row) => { events.push(value); return value; } };
    },
  };
  const db = {
    async transaction<T>(isolation: string, run: (manager: typeof fakeManager) => Promise<T>) {
      assert.equal(isolation, 'SERIALIZABLE');
      const before = structuredClone(tables);
      const previousEventCount = events.length;
      try { return await run(fakeManager); }
      catch (error) {
        for (const key of Object.keys(tables) as Array<keyof Tables>) tables[key] = before[key];
        events.splice(previousEventCount);
        throw error;
      }
    },
  } as unknown as DataSource;
  return { db, tables, events, userId, setFailure: (fragment: string) => { failOn = fragment; } };
}

function outputDir() { return join(tmpdir(), `inactive-user-reconciliation-test-${randomUUID()}`); }

test('dry run snapshots affected rows and makes no database writes', async () => {
  const { db, tables } = fixture();
  const before = structuredClone(tables);
  const dir = outputDir();
  const result = await reconcile(db, false, dir);
  assert.equal(result.count, 1);
  assert.deepEqual(tables, before);
  assert.match(await readFile(join(dir, 'report.md'), 'utf8'), /Read-only preflight/);
  const snapshot = JSON.parse(await readFile(join(dir, 'snapshot.json'), 'utf8')) as { rows: Tables };
  assert.equal(snapshot.rows.team_memberships.length, 1);
});

test('apply revokes access, preserves past assignments and activity, and appends actor events', async () => {
  const { db, tables, events, userId } = fixture();
  const historicalId = tables.team_memberships[1]!.id;
  const dir = outputDir();
  await reconcile(db, true, dir);
  assert.equal(tables.users[0]!.role, 'user');
  assert.equal(tables.users[0]!.banned, true);
  assert.equal(tables.session.length, 0);
  assert.equal(tables.apikey[0]!.enabled, false);
  assert.equal(tables.verification.length, 0);
  assert.equal(tables.email_outbox[0]!.status, 'cancelled');
  assert.deepEqual(tables.team_memberships.map((row) => row.id), [historicalId]);
  assert.equal(tables.committee_memberships.length, 0);
  assert.equal(tables.user_information[0]!.leaveDate, '2025-08-31');
  assert.deepEqual(events.map((event) => event.eventType).sort(), [
    'committee.member_removed', 'team.member_removed', 'user.membership_status_changed', 'user.role_changed',
  ].sort());
  assert.ok(events.every((event) => (event.metadata as Row).actorUserId === ACTOR));
  assert.match(await readFile(join(dir, 'before-after.csv'), 'utf8'), new RegExp(userId));
});

test('failure rolls back every data and event change', async () => {
  const { db, tables, events, setFailure } = fixture();
  const before = structuredClone(tables);
  setFailure('DELETE FROM "verification"');
  const dir = outputDir();
  await assert.rejects(reconcile(db, true, dir), /injected DB failure/);
  assert.deepEqual(tables, before);
  assert.equal(events.length, 0);
  assert.match(await readFile(join(dir, 'report.md'), 'utf8'), /transaction rolled back/);
});

test('snapshot limit blocks runs before mutation', () => {
  const snapshot = fixture().tables;
  snapshot.users = Array.from({ length: 100_001 }, () => ({ id: 'x' }));
  assert.throws(() => assertSnapshotLimit(snapshot), /approval limit/);
});

test('reports PostgreSQL date values in Amsterdam calendar time', () => {
  const snapshot = fixture().tables;
  snapshot.user_information[0]!.leaveDate = new Date('2026-09-24T22:00:00.000Z');
  assert.equal(summarize(snapshot, [String(snapshot.users[0]!.id)])[0]!.leaveDate, '2026-09-25');
});
