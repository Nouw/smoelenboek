import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [detail, grid, page, translations, handler] = await Promise.all([
  readFile(new URL('app/teams/[teamId]/team-detail.tsx', root), 'utf8'),
  readFile(new URL('app/teams/team-grid.tsx', root), 'utf8'),
  readFile(new URL('app/teams/[teamId]/page.tsx', root), 'utf8'),
  readFile(new URL('lib/i18n.tsx', root), 'utf8'),
  readFile(
    new URL('../../packages/rpc/src/teams/queries/team.handlers.ts', root),
    'utf8',
  ),
]);

const criteria = [
  ['Team cards are navigable', /href={`\/teams\/\${team\.id}`}/.test(grid)],
  [
    'Invalid team identifiers return 404',
    /z\.uuid\(\)\.safeParse/.test(page) && /notFound\(\)/.test(page),
  ],
  [
    'Roster loads in one client request',
    /teams\.currentRoster\.useQuery/.test(detail) &&
      !/user\.byId\.useQuery/.test(detail),
  ],
  [
    'Current season is visible',
    /teams\.currentSeason/.test(detail) && /season\.label/.test(detail),
  ],
  [
    'Team identity overlays the image banner',
    /absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t/.test(detail) &&
      /relative flex min-h-\[28rem\] flex-col justify-end/.test(detail) &&
      /text-white drop-shadow-sm/.test(detail),
  ],
  [
    'Gradient stays behind the team identity only',
    /bottom-0 h-48 bg-gradient-to-t/.test(detail) &&
      /to-transparent md:h-56/.test(detail) &&
      !/absolute inset-0 bg-gradient-to-t/.test(detail),
  ],
  [
    'Complete team photo remains visible',
    /md:min-h-\[38rem\]/.test(detail) &&
      /h-full w-full object-contain/.test(detail) &&
      /object-cover opacity-45 blur-2xl/.test(detail),
  ],
  [
    'Coaches and players are separate',
    /teams\.coaches/.test(detail) && /teams\.players/.test(detail),
  ],
  [
    'Roster cards open profiles',
    /href={`\/profile\/\${member\.userId}`}/.test(detail),
  ],
  [
    'Roster is responsive',
    /sm:grid-cols-2/.test(detail) && /lg:grid-cols-3/.test(detail),
  ],
  [
    'Photos have fallbacks and labels',
    /AvatarFallback/.test(detail) && /aria-label=/.test(detail),
  ],
  [
    'Failure and empty states are actionable',
    /roster\.isError/.test(detail) &&
      /roster\.refetch/.test(detail) &&
      /members\.length === 0/.test(detail),
  ],
  [
    'Dutch and English are supported',
    /Geen spelers/.test(translations) && /No players/.test(translations),
  ],
  [
    'Server groups and traces roster counts',
    /role === 'coach_trainer'/.test(handler) &&
      /current_team_roster_loaded/.test(handler) &&
      /playerCount/.test(handler),
  ],
];

const passing = criteria.filter(([, passed]) => passed).length;
const score = Math.round((passing / criteria.length) * 100);

for (const [criterion, passed] of criteria) {
  console.log((passed ? 'PASS ' : 'FAIL ') + criterion);
}

if (score < 90) {
  throw new Error(`Team detail UX eval scored ${score}; required score is 90.`);
}

console.log(`Team detail UX eval passed with ${score}/100.`);
