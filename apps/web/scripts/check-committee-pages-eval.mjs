import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [detail, grid, page, translations, handler, sidebar] = await Promise.all([
  readFile(
    new URL('app/committees/[committeeId]/committee-detail.tsx', root),
    'utf8',
  ),
  readFile(new URL('app/committees/committee-grid.tsx', root), 'utf8'),
  readFile(new URL('app/committees/[committeeId]/page.tsx', root), 'utf8'),
  readFile(new URL('lib/i18n.tsx', root), 'utf8'),
  readFile(
    new URL(
      '../../packages/rpc/src/committees/queries/committee.handlers.ts',
      root,
    ),
    'utf8',
  ),
  readFile(new URL('components/app-sidebar.tsx', root), 'utf8'),
]);

const criteria = [
  [
    'Committee navigation opens the list',
    /url: "\/committees"/.test(sidebar),
  ],
  [
    'Committee list handles loading, errors, and no results',
    /committees\.isLoading/.test(grid) &&
      /committees\.isError/.test(grid) &&
      /visibleCommittees\.length === 0/.test(grid),
  ],
  [
    'Committee cards open detail pages',
    /href={`\/committees\/\${committee\.id}`}/.test(grid),
  ],
  [
    'Invalid committee identifiers return 404',
    /z\.uuid\(\)\.safeParse/.test(page) && /notFound\(\)/.test(page),
  ],
  [
    'Roster loads in one client request',
    /committees\.currentRoster\.useQuery/.test(detail) &&
      !/user\.byId\.useQuery/.test(detail),
  ],
  [
    'Current season and committee identity are visible',
    /committees\.currentSeason/.test(detail) &&
      /committee\.name/.test(detail) &&
      /season\.label/.test(detail),
  ],
  [
    'Member cards open profiles and show roles',
    /href={`\/profile\/\${member\.userId}`}/.test(detail) &&
      /roleTranslationKeys\[member\.role\]/.test(detail),
  ],
  [
    'Member grid is responsive and accessible',
    /sm:grid-cols-2/.test(detail) &&
      /lg:grid-cols-3/.test(detail) &&
      /aria-label=/.test(detail),
  ],
  [
    'Photos have an initials fallback',
    /AvatarFallback/.test(detail) && /initials\(member\.name\)/.test(detail),
  ],
  [
    'Failure and empty states are actionable',
    /roster\.isError/.test(detail) &&
      /roster\.refetch/.test(detail) &&
      /members\.length === 0/.test(detail),
  ],
  [
    'Dutch and English are supported',
    /Geen commissieleden/.test(translations) &&
      /No committee members/.test(translations),
  ],
  [
    'Server batches users, sorts members, and traces the count',
    /usersRepository\.findByIds/.test(handler) &&
      /sort\(compareRosterMembers\)/.test(handler) &&
      /current_committee_roster_loaded/.test(handler) &&
      /memberCount/.test(handler),
  ],
];

const passing = criteria.filter(([, passed]) => passed).length;
const score = Math.round((passing / criteria.length) * 100);

for (const [criterion, passed] of criteria) {
  console.log((passed ? 'PASS ' : 'FAIL ') + criterion);
}

if (score < 90) {
  throw new Error(
    `Committee pages UX eval scored ${score}; required score is 90.`,
  );
}

console.log(`Committee pages UX eval passed with ${score}/100.`);
