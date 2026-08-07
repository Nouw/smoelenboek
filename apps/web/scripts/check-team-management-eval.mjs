import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [list, detail, sidebar, filters, router, commands, queryHandler, i18n] =
  await Promise.all([
    readFile(new URL('app/teams/admin/team-admin-content.tsx', root), 'utf8'),
    readFile(
      new URL('app/teams/admin/[teamId]/team-admin-detail.tsx', root),
      'utf8',
    ),
    readFile(new URL('components/app-sidebar.tsx', root), 'utf8'),
    readFile(new URL('app/teams/team-filters.ts', root), 'utf8'),
    readFile(
      new URL('../../packages/rpc/src/teams/trpc/team.router.ts', root),
      'utf8',
    ),
    readFile(
      new URL('../../packages/rpc/src/teams/commands/team.handlers.ts', root),
      'utf8',
    ),
    readFile(
      new URL('../../packages/rpc/src/teams/queries/team.handlers.ts', root),
      'utf8',
    ),
    readFile(new URL('lib/i18n.tsx', root), 'utf8'),
  ]);

const criteria = [
  ['Admin workspace is discoverable', /nav\.manageTeams/.test(sidebar)],
  [
    'UI and RPC enforce admin access',
    /currentUser\.isAdmin/.test(list) &&
      /currentUser\.isAdmin/.test(detail) &&
      (router.match(/adminProcedure/g)?.length ?? 0) >= 8,
  ],
  [
    'Team lifecycle is complete',
    /teams\.create/.test(list) &&
      /teams\.update/.test(detail) &&
      /teams\.archive/.test(detail) &&
      /teams\.restore/.test(detail),
  ],
  [
    'Categories replace name inference',
    /team\.category/.test(filters) && !/startsWith/.test(filters),
  ],
  [
    'Archived teams leave member overviews',
    /archivedAt === null/.test(filters),
  ],
  [
    'Any valid season can be selected',
    /min=\{1900\}/.test(detail) && /max=\{3000\}/.test(detail),
  ],
  [
    'Member search is debounced',
    /user\.search/.test(detail) && /setDebouncedSearch/.test(detail),
  ],
  [
    'Volleyball roles stay available',
    /coach_trainer/.test(detail) && /outside_hitter/.test(detail),
  ],
  [
    'Removal is immediate and has no expiry date',
    /RemoveMembershipDialog/.test(detail) &&
      /removeMember\.mutate\(\{ membershipId: membership\.id \}\)/.test(detail) &&
      !/endedOn/.test(detail),
  ],
  [
    'Assignment start dates are explicit',
    /startedOn/.test(detail),
  ],
  [
    'History is invalidated after edits',
    /membershipHistory\.invalidate/.test(detail),
  ],
  [
    'Command failures are actionable',
    /ConflictException/.test(commands) && /BadRequestException/.test(commands),
  ],
  [
    'Admin actions are traced',
    /actorUserId/.test(commands) && /team_membership_removed/.test(commands),
  ],
  [
    'Roster load is batched and traced',
    /findByIds/.test(queryHandler) &&
      /team_roster_for_season_loaded/.test(queryHandler),
  ],
  [
    'Dutch and English are complete',
    /Teams beheren/.test(i18n) && /Manage teams/.test(i18n),
  ],
];

const passing = criteria.filter(([, passed]) => passed).length;
const score = Math.round((passing / criteria.length) * 100);

for (const [criterion, passed] of criteria) {
  console.log((passed ? 'PASS ' : 'FAIL ') + criterion);
}

if (score < 90) {
  throw new Error(
    `Team management UX eval scored ${score}; required score is 90.`,
  );
}

console.log(`Team management UX eval passed with ${score}/100.`);
