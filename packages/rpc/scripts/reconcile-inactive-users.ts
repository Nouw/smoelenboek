/**
 * One-time reconciliation for accounts whose leaveDate predates the admin
 * deregistration workflow. Default invocation is read-only. Never run against
 * production without the normal production change approval and a DB backup.
 *
 * Run from packages/rpc:
 *   node -r ts-node/register -r tsconfig-paths/register scripts/reconcile-inactive-users.ts
 *   node -r ts-node/register -r tsconfig-paths/register scripts/reconcile-inactive-users.ts --apply
 *
 * The apply run snapshots every affected row under /tmp before its first write.
 * Snapshots include personal data and authentication records: retain securely.
 */
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DataSource, EntityManager } from 'typeorm';

import { CommitteeMemberRemovedEvent } from '../src/committees/events/committee-events';
import { EventStoreRepository } from '../src/event-store/repositories/event-store.repository';
import { TeamMemberRemovedEvent } from '../src/teams/events/team-events';
import { getLocalDate, getSeasonKey } from '../src/seasons/season-policy';
import { UserMembershipStatusChangedEvent } from '../src/users/events/user-membership-status-changed.event';
import { UserRoleChangedEvent } from '../src/users/events/user-role-changed.event';

export const ACTOR = 'system:inactive-user-reconciliation';
export const MAX_SNAPSHOT_ROWS = 100_000;
export const MAX_SNAPSHOT_BYTES = 100 * 1024 * 1024;

type Row = Record<string, unknown>;
type Snapshot = {
  users: Row[];
  user_information: Row[];
  session: Row[];
  apikey: Row[];
  verification: Row[];
  email_outbox: Row[];
  team_memberships: Row[];
  committee_memberships: Row[];
};
type Summary = {
  userId: string;
  leaveDate: string;
  role: string;
  banned: boolean;
  sessions: number;
  enabledKeys: number;
  resetLinks: number;
  pendingAccessMail: number;
  teams: number;
  committees: number;
};

const tables = [
  ['users', '"id"'],
  ['user_information', '"userId"'],
  ['session', '"userId"'],
  ['apikey', '"referenceId"'],
  ['verification', '"value"'],
  ['email_outbox', '"relatedUserId"'],
  ['team_memberships', '"userId"'],
  ['committee_memberships', '"userId"'],
] as const;

function csvCell(value: unknown): string {
  const string = String(value ?? '');
  return `"${string.replaceAll('"', '""')}"`;
}

export function assertSnapshotLimit(snapshot: Snapshot): { rows: number; bytes: number } {
  const rows = Object.values(snapshot).reduce((sum, entries) => sum + entries.length, 0);
  if (rows > MAX_SNAPSHOT_ROWS) {
    throw new Error(`Snapshot exceeds approval limit (${rows} rows). Stop and ask Julien before snapshotting or applying.`);
  }
  // Include the serialized envelope and whitespace used in snapshot.json.
  const bytes = Buffer.byteLength(JSON.stringify({ capturedAt: new Date().toISOString(), actorUserId: ACTOR, rows: snapshot }, null, 2)) + 1;
  if (bytes > MAX_SNAPSHOT_BYTES) {
    throw new Error(`Snapshot exceeds approval limit (${rows} rows, ${bytes} bytes). Stop and ask Julien before snapshotting or applying.`);
  }
  return { rows, bytes };
}

export function summarize(snapshot: Snapshot, userIds: string[]): Summary[] {
  const rows = (table: string, userId: string, key: string) =>
    (snapshot[table] ?? []).filter((row) => row[key] === userId);
  return userIds.map((userId) => {
    const user = rows('users', userId, 'id')[0];
    const information = rows('user_information', userId, 'userId')[0];
    const keys = rows('apikey', userId, 'referenceId');
    const mails = rows('email_outbox', userId, 'relatedUserId');
    return {
      userId,
      leaveDate: information?.leaveDate instanceof Date
        ? getLocalDate(information.leaveDate)
        : String(information?.leaveDate ?? ''),
      role: String(user?.role ?? ''),
      banned: user?.banned === true,
      sessions: rows('session', userId, 'userId').length,
      enabledKeys: keys.filter((row) => row.enabled === true).length,
      resetLinks: rows('verification', userId, 'value').filter((row) => String(row.identifier).startsWith('reset-password:')).length,
      pendingAccessMail: mails.filter((row) => ['invitation', 'password_reset'].includes(String(row.messageType)) && ['pending', 'sending'].includes(String(row.status))).length,
      teams: rows('team_memberships', userId, 'userId').length,
      committees: rows('committee_memberships', userId, 'userId').length,
    };
  });
}

export function beforeAfterCsv(before: Summary[], after: Summary[]): string {
  const keys = ['userId', 'leaveDate', 'role', 'banned', 'sessions', 'enabledKeys', 'resetLinks', 'pendingAccessMail', 'teams', 'committees'] as const;
  const lines = [[...keys.map((key) => `before_${key}`), ...keys.map((key) => `after_${key}`)].map(csvCell).join(',')];
  for (let index = 0; index < before.length; index += 1) {
    const a = after[index];
    if (!a || a.userId !== before[index]!.userId) throw new Error('Before/after user mismatch');
    lines.push([...keys.map((key) => before[index]![key]), ...keys.map((key) => a[key])].map(csvCell).join(','));
  }
  return `${lines.join('\n')}\n`;
}

async function affectedIds(manager: EntityManager, lock: boolean, seasonKey: number): Promise<string[]> {
  if (lock) await manager.query(`SELECT pg_advisory_xact_lock(hashtext('users.admin-role-change'))`);
  const users = await manager.query(`
    SELECT u."id" FROM "users" u
    JOIN "user_information" ui ON ui."userId" = u."id"
    WHERE ui."leaveDate" IS NOT NULL AND (
      u."banned" = false OR u."role" <> 'user'
      OR EXISTS (SELECT 1 FROM "session" s WHERE s."userId" = u."id")
      OR EXISTS (SELECT 1 FROM "apikey" k WHERE k."referenceId" = u."id" AND k."enabled" = true)
      OR EXISTS (SELECT 1 FROM "verification" v WHERE v."value" = u."id" AND v."identifier" LIKE 'reset-password:%')
      OR EXISTS (SELECT 1 FROM "email_outbox" o WHERE o."relatedUserId" = u."id" AND o."messageType" IN ('invitation', 'password_reset') AND o."status" IN ('pending', 'sending'))
      OR EXISTS (SELECT 1 FROM "team_memberships" t WHERE t."userId" = u."id" AND t."seasonKey" >= $1 AND t."endedOn" IS NULL)
      OR EXISTS (SELECT 1 FROM "committee_memberships" c WHERE c."userId" = u."id" AND c."seasonKey" >= $1 AND c."endedOn" IS NULL)
    ) ORDER BY u."id" ${lock ? 'FOR UPDATE OF u' : ''}
  `, [seasonKey]) as Array<{ id: string }>;
  return users.map((user) => user.id);
}

async function snapshotRows(manager: EntityManager, ids: string[], seasonKey: number): Promise<Snapshot> {
  const snapshot: Snapshot = {
    users: [], user_information: [], session: [], apikey: [], verification: [],
    email_outbox: [], team_memberships: [], committee_memberships: [],
  };
  for (const [table, key] of tables) {
    const activeAssignment = table === 'team_memberships' || table === 'committee_memberships';
    snapshot[table] = ids.length
      ? await manager.query(`SELECT * FROM "${table}" WHERE ${key}::text = ANY($1::text[]) ${activeAssignment ? 'AND "seasonKey" >= $2 AND "endedOn" IS NULL' : ''} ORDER BY ${key}`, activeAssignment ? [ids, seasonKey] : [ids]) as Row[]
      : [];
    assertSnapshotLimit(snapshot);
  }
  return snapshot;
}

function progressLine(done: number, total: number, started: number): string {
  const elapsed = Math.max(1, Date.now() - started);
  const etaSeconds = done ? Math.ceil((total - done) * elapsed / done / 1000) : 0;
  return `${new Date().toISOString()} Inactive user reconciliation ${Math.floor(done * 100 / Math.max(total, 1))}% done, ETA ${etaSeconds}s, ${done}/${total} users`;
}

export async function reconcile(dataSource: DataSource, apply: boolean, outputDir: string): Promise<{ count: number; outputDir: string }> {
  const store = new EventStoreRepository(dataSource);
  await mkdir(outputDir, { recursive: false, mode: 0o700 });
  process.stdout.write(`Follow progress: tail -f ${join(outputDir, 'progress.log')}\n`);
  const log = async (done: number, total: number, started: number) => {
    const line = progressLine(done, total, started);
    await appendFile(join(outputDir, 'progress.log'), `${line}\n`, { mode: 0o600 });
    process.stdout.write(`${line}\n`);
  };
  const started = Date.now();
  const seasonKey = getSeasonKey(new Date(started));
  let result: { ids: string[]; before: Summary[]; after: Summary[]; size: { rows: number; bytes: number } };
  try {
    result = await dataSource.transaction('SERIALIZABLE', async (manager) => {
    const ids = await affectedIds(manager, apply, seasonKey);
    const beforeRows = await snapshotRows(manager, ids, seasonKey);
    const size = assertSnapshotLimit(beforeRows);
    const before = summarize(beforeRows, ids);
    await writeFile(join(outputDir, 'snapshot.json'), `${JSON.stringify({ capturedAt: new Date().toISOString(), actorUserId: ACTOR, rows: beforeRows }, null, 2)}\n`, { mode: 0o600 });
    await log(0, ids.length, started);
    if (!apply) {
      await writeFile(join(outputDir, 'report.md'), `# Inactive user reconciliation preflight\n\nAffected users: ${ids.length}. Snapshot: ${size.rows} rows, ${size.bytes} bytes. No database changes made.\n`, { mode: 0o600 });
      return { ids, before, after: before, size };
    }
    for (const [index, userId] of ids.entries()) {
      const user = beforeRows.users.find((row) => row.id === userId);
      const info = beforeRows.user_information.find((row) => row.userId === userId);
      if (!user || !info) throw new Error(`Snapshot missing user ${userId}`);
      await manager.query(`UPDATE "users" SET "role" = 'user', "banned" = true, "banReason" = CASE WHEN "banned" THEN "banReason" ELSE 'membership ended' END, "banExpires" = NULL, "updatedAt" = now() WHERE "id" = $1`, [userId]);
      await manager.query(`DELETE FROM "session" WHERE "userId" = $1`, [userId]);
      await manager.query(`UPDATE "apikey" SET "enabled" = false, "updatedAt" = now() WHERE "referenceId" = $1`, [userId]);
      await manager.query(`DELETE FROM "verification" WHERE "value" = $1 AND "identifier" LIKE 'reset-password:%'`, [userId]);
      await manager.query(`UPDATE "email_outbox" SET "status" = 'cancelled', "updatedAt" = now() WHERE "relatedUserId" = $1 AND "messageType" IN ('invitation', 'password_reset') AND "status" IN ('pending', 'sending')`, [userId]);
      const teams = beforeRows.team_memberships.filter((row) => row.userId === userId);
      const committees = beforeRows.committee_memberships.filter((row) => row.userId === userId);
      await manager.query(`DELETE FROM "team_memberships" WHERE "userId" = $1 AND "seasonKey" >= $2 AND "endedOn" IS NULL`, [userId, seasonKey]);
      await manager.query(`DELETE FROM "committee_memberships" WHERE "userId" = $1 AND "seasonKey" >= $2 AND "endedOn" IS NULL`, [userId, seasonKey]);
      for (const row of teams) await store.append(TeamMemberRemovedEvent.create({ membershipId: String(row.id) }, ACTOR), manager);
      for (const row of committees) await store.append(CommitteeMemberRemovedEvent.create({ membershipId: String(row.id) }, ACTOR), manager);
      if (user.role !== 'user') await store.append(UserRoleChangedEvent.create({ userId, role: 'user' }, ACTOR), manager);
      await store.append(UserMembershipStatusChangedEvent.create({ userId, leaveDate: before[index]!.leaveDate }, ACTOR), manager);
      if ((index + 1) % 100 === 0 || index + 1 === ids.length) await log(index + 1, ids.length, started);
    }
    const after = summarize(await snapshotRows(manager, ids, seasonKey), ids);
    for (const row of after) {
      if (row.role !== 'user' || !row.banned || row.sessions || row.enabledKeys || row.resetLinks || row.pendingAccessMail || row.teams || row.committees) {
        throw new Error(`Verification failed for ${row.userId}; transaction rolled back`);
      }
    }
    return { ids, before, after, size };
    });
  } catch (error) {
    await writeFile(join(outputDir, 'report.md'), `# Inactive user reconciliation\n\nVerdict: failed; transaction rolled back.\n\nError: ${String(error)}\n\nIf snapshot.json exists, it was captured before any database writes.\n`, { mode: 0o600 });
    throw error;
  }
  await writeFile(join(outputDir, 'before-after.csv'), beforeAfterCsv(result.before, result.after), { mode: 0o600 });
  const examples = result.before.slice(0, 5).map((row, index) => {
    const after = result.after[index]!;
    return `| ${row.userId} | ${row.role} / ${row.banned} / ${row.sessions} / ${row.enabledKeys} / ${row.teams + row.committees} | ${after.role} / ${after.banned} / ${after.sessions} / ${after.enabledKeys} / ${after.teams + after.committees} |`;
  });
  const total = (rows: Summary[], key: 'sessions' | 'enabledKeys' | 'resetLinks' | 'pendingAccessMail' | 'teams' | 'committees') =>
    rows.reduce((sum, row) => sum + row[key], 0);
  const categories = [
    ['Active sessions', total(result.before, 'sessions'), total(result.after, 'sessions')],
    ['Enabled API keys', total(result.before, 'enabledKeys'), total(result.after, 'enabledKeys')],
    ['Reset links', total(result.before, 'resetLinks'), total(result.after, 'resetLinks')],
    ['Pending access mail', total(result.before, 'pendingAccessMail'), total(result.after, 'pendingAccessMail')],
    ['Current team assignments', total(result.before, 'teams'), total(result.after, 'teams')],
    ['Current committee assignments', total(result.before, 'committees'), total(result.after, 'committees')],
    ['Admin accounts', result.before.filter((row) => row.role === 'admin').length, result.after.filter((row) => row.role === 'admin').length],
    ['Unbanned accounts', result.before.filter((row) => !row.banned).length, result.after.filter((row) => !row.banned).length],
  ];
  const verdict = apply ? 'Reconciliation committed and verified' : 'Read-only preflight completed';
  await writeFile(join(outputDir, 'report.md'), `# Inactive user reconciliation\n\nVerdict: ${verdict}.\n\nAffected users: ${result.ids.length}. Snapshot: ${result.size.rows} rows, ${result.size.bytes} bytes. Actor: ${ACTOR}.\n\n| Category | Before | After |\n| --- | ---: | ---: |\n${categories.map(([name, before, after]) => `| ${name} | ${before} | ${after} |`).join('\n')}\n\n| User | Before role / banned / sessions / active keys / assignments | After |\n| --- | --- | --- |\n${examples.join('\n')}\n\nFull row comparison: before-after.csv. Restore source: snapshot.json.\n`, { mode: 0o600 });
  return { count: result.ids.length, outputDir };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--apply')) throw new Error('Only --apply is supported');
  const apply = args.includes('--apply');
  const outputDir = join('/tmp', `inactive-user-reconciliation-${new Date().toISOString().replaceAll(':', '-')}-${process.pid}`);
  // Importing the application DataSource loads its usual environment config.
  // There is deliberately no alternate production connection path in this script.
  const dataSource = require('../src/database/data-source').default as DataSource;
  dataSource.initialize()
    .then(() => reconcile(dataSource, apply, outputDir))
    .then(({ count }) => process.stdout.write(`${apply ? 'Applied' : 'Preflight'}: ${count} users. Artifacts: ${outputDir}\n`))
    .catch((error: unknown) => { process.stderr.write(`${String(error)}\nArtifacts (if created): ${outputDir}\n`); process.exitCode = 1; })
    .finally(async () => { if (dataSource.isInitialized) await dataSource.destroy(); });
}
