import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [
  list,
  detail,
  sidebar,
  router,
  commands,
  queryHandler,
  publicDetail,
  i18n,
] = await Promise.all([
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
  readFile(new URL('components/app-sidebar.tsx', root), 'utf8'),
  readFile(
    new URL('../../packages/rpc/src/committees/trpc/committee.router.ts', root),
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
      '../../packages/rpc/src/committees/queries/committee.handlers.ts',
      root,
    ),
    'utf8',
  ),
  readFile(
    new URL('app/committees/[committeeId]/committee-detail.tsx', root),
    'utf8',
  ),
  readFile(new URL('lib/i18n.tsx', root), 'utf8'),
]);

const criteria = [
  ['Admin workspace is discoverable', /nav\.manageCommittees/.test(sidebar)],
  [
    'UI and RPC enforce admin access',
    /currentUser\.isAdmin/.test(list) &&
      /currentUser\.isAdmin/.test(detail) &&
      (router.match(/adminProcedure/g)?.length ?? 0) >= 8,
  ],
  [
    'Committee lifecycle is complete',
    /committees\.create/.test(list) &&
      /committees\.update/.test(detail) &&
      /committees\.archive/.test(detail) &&
      /committees\.restore/.test(detail),
  ],
  [
    'Banner URL can be updated and is publicly rendered',
    /name="imageUrl"/.test(list) && /committee\.imageUrl/.test(publicDetail),
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
    'All committee roles stay available',
    /commissaris_externe_zaken/.test(detail) &&
      /commissaris_zaalwacht_en_arbitrage/.test(detail),
  ],
  [
    'Assignment start dates are explicit and removal is immediate',
    /startedOn/.test(detail) &&
      /removeMember\.mutate\(\{ membershipId: membership\.id \}\)/.test(detail),
  ],
  [
    'History and committee queries invalidate after edits',
    /membershipHistory\.invalidate/.test(detail) &&
      /utils\.committees\.invalidate/.test(detail),
  ],
  [
    'Command failures are actionable',
    /ConflictException/.test(commands) && /BadRequestException/.test(commands),
  ],
  [
    'Admin actions are traced',
    /actorUserId/.test(commands) &&
      /committee_membership_removed/.test(commands),
  ],
  [
    'Roster loading is batched and traced',
    /findByIds/.test(queryHandler) &&
      /committee_roster_for_season_loaded/.test(queryHandler),
  ],
  [
    'Dutch and English are complete',
    /Commissies beheren/.test(i18n) && /Manage committees/.test(i18n),
  ],
];

const passing = criteria.filter(([, passed]) => passed).length;
const score = Math.round((passing / criteria.length) * 100);
for (const [criterion, passed] of criteria) {
  console.log((passed ? 'PASS ' : 'FAIL ') + criterion);
}
if (score < 90) {
  throw new Error(
    `Committee management UX eval scored ${score}; required score is 90.`,
  );
}
console.log(`Committee management UX eval passed with ${score}/100.`);
