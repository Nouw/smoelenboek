import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [list, detail, page, sidebar, router, handler, migration, i18n] =
  await Promise.all([
    readFile(
      new URL('app/committees/admin/committee-admin-content.tsx', root),
      'utf8',
    ),
    readFile(
      new URL(
        'app/committees/admin/[committeeId]/committee-admin-detail.tsx',
        root,
      ),
      'utf8',
    ),
    readFile(
      new URL('app/committees/admin/[committeeId]/page.tsx', root),
      'utf8',
    ),
    readFile(new URL('components/app-sidebar.tsx', root), 'utf8'),
    readFile(
      new URL(
        '../../packages/rpc/src/committees/trpc/committee.router.ts',
        root,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../../packages/rpc/src/committees/commands/committee.handlers.ts',
        root,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../../packages/rpc/src/database/migrations/1769500000000-AddCommitteeImageUrl.ts',
        root,
      ),
      'utf8',
    ),
    readFile(new URL('lib/i18n.tsx', root), 'utf8'),
  ]);

assert.match(list, /currentUser\.isAdmin/);
assert.match(detail, /currentUser\.isAdmin/);
assert.match(page, /z\.uuid\(\)\.safeParse\(committeeId\)/);
assert.match(sidebar, /nav\.manageCommittees/);
assert.match(sidebar, /url: '\/committees\/admin'/);

for (const procedure of [
  'membershipsBySeason',
  'rosterForSeason',
  'create',
  'update',
  'archive',
  'restore',
  'assignMember',
  'removeMember',
]) {
  assert.match(
    router,
    new RegExp(`${procedure}: adminProcedure`),
    `${procedure} must be admin-only`,
  );
}

assert.match(router, /imageUrl: z\.string\(\)\.url\(\)\.nullable\(\)/);
assert.match(router, /startedOn: z\.iso\.date\(\)/);
assert.match(list, /trpc\.committees\.create\.useMutation/);
assert.match(detail, /trpc\.committees\.update\.useMutation/);
assert.match(detail, /trpc\.committees\.archive\.useMutation/);
assert.match(detail, /trpc\.committees\.restore\.useMutation/);
assert.match(detail, /trpc\.committees\.rosterForSeason\.useQuery/);
assert.match(detail, /trpc\.committees\.assignMember\.useMutation/);
assert.match(detail, /trpc\.committees\.removeMember\.useMutation/);
assert.match(detail, /trpc\.user\.search\.useQuery/);
assert.match(detail, /setTimeout\(\(\) => setDebouncedSearch\(search\), 250\)/);
assert.match(detail, /type="number"/);
assert.match(detail, /min=\{1900\}/);
assert.match(detail, /max=\{3000\}/);
assert.match(detail, /selectedSeasonKey !== undefined/);
assert.match(
  detail,
  /removeMember\.mutate\(\{ membershipId: membership\.id \}\)/,
);
assert.match(detail, /utils\.committees\.invalidate/);
assert.match(detail, /utils\.user\.membershipHistory\.invalidate/);
assert.match(handler, /actorUserId/);
assert.match(handler, /findActiveAssignment/);
assert.match(migration, /ALTER TABLE "committees" ADD "imageUrl"/);
assert.match(i18n, /Commissies beheren/);
assert.match(i18n, /Manage committees/);

console.log('Committee management contract passed.');
