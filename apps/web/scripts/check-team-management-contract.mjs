import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [
  list,
  detail,
  page,
  sidebar,
  filters,
  teamRouter,
  userRouter,
  migration,
  i18n,
] = await Promise.all([
  readFile(new URL('app/teams/admin/team-admin-content.tsx', root), 'utf8'),
  readFile(
    new URL('app/teams/admin/[teamId]/team-admin-detail.tsx', root),
    'utf8',
  ),
  readFile(new URL('app/teams/admin/[teamId]/page.tsx', root), 'utf8'),
  readFile(new URL('components/app-sidebar.tsx', root), 'utf8'),
  readFile(new URL('app/teams/team-filters.ts', root), 'utf8'),
  readFile(
    new URL('../../packages/rpc/src/teams/trpc/team.router.ts', root),
    'utf8',
  ),
  readFile(
    new URL('../../packages/rpc/src/users/trpc/user.router.ts', root),
    'utf8',
  ),
  readFile(
    new URL(
      '../../packages/rpc/src/database/migrations/1768800000000-AddTeamCategory.ts',
      root,
    ),
    'utf8',
  ),
  readFile(new URL('lib/i18n.tsx', root), 'utf8'),
]);

assert.match(list, /currentUser\.isAdmin/);
assert.match(detail, /currentUser\.isAdmin/);
assert.match(page, /z\.uuid\(\)\.safeParse\(teamId\)/);
assert.match(sidebar, /nav\.manageTeams/);
assert.match(sidebar, /url: '\/teams\/admin'/);
assert.match(filters, /team\.category === 'men'/);
assert.match(filters, /team\.category === 'women'/);
assert.match(filters, /team\.archivedAt === null/);
assert.doesNotMatch(filters, /startsWith/);

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
    teamRouter,
    new RegExp(`${procedure}: adminProcedure`),
    `${procedure} must be admin-only`,
  );
}

assert.match(teamRouter, /category: teamCategorySchema/);
assert.match(
  teamRouter,
  /seasonKey: z\.number\(\).*\.min\(1900\).*\.max\(3000\)/s,
);
assert.match(teamRouter, /startedOn: z\.iso\.date\(\)/);
assert.match(teamRouter, /endedOn: z\.iso\.date\(\)/);
assert.match(userRouter, /search: protectedProcedure/);
assert.match(userRouter, /z\.array\(userSummaryOutputSchema\)\.max\(20\)/);

assert.match(list, /trpc\.teams\.create\.useMutation/);
assert.match(detail, /trpc\.teams\.update\.useMutation/);
assert.match(detail, /trpc\.teams\.archive\.useMutation/);
assert.match(detail, /trpc\.teams\.restore\.useMutation/);
assert.match(detail, /trpc\.teams\.assignMember\.useMutation/);
assert.match(detail, /trpc\.teams\.removeMember\.useMutation/);
assert.match(detail, /trpc\.teams\.rosterForSeason\.useQuery/);
assert.match(detail, /trpc\.user\.search\.useQuery/);
assert.match(detail, /setTimeout\(\(\) => setDebouncedSearch\(search\), 250\)/);
assert.match(detail, /type="number"/);
assert.match(detail, /min=\{1900\}/);
assert.match(detail, /max=\{3000\}/);
assert.match(detail, /endedMemberships/);
assert.match(detail, /utils\.teams\.invalidate/);
assert.match(detail, /utils\.user\.membershipHistory\.invalidate/);

assert.match(migration, /Cannot classify % team\(s\)/);
assert.match(migration, /'category', team\."category"/);
assert.match(migration, /CHECK \("category" IN \('men', 'women'\)\)/);
assert.match(i18n, /Teams beheren/);
assert.match(i18n, /Manage teams/);

console.log('Team management contract passed.');
