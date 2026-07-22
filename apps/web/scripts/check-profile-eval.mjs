import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [page, profile, navigation, translations, userRouter] = await Promise.all(
  [
    readFile(new URL('app/profile/[userId]/page.tsx', root), 'utf8'),
    readFile(new URL('app/profile/profile-content.tsx', root), 'utf8'),
    readFile(new URL('components/nav-user.tsx', root), 'utf8'),
    readFile(new URL('lib/i18n.tsx', root), 'utf8'),
    readFile(
      new URL('../../packages/rpc/src/users/trpc/user.router.ts', root),
      'utf8',
    ),
  ],
);
const criteria = [
  [
    'Discoverable from account navigation',
    /'\/profile\/' \+ profileUserId/.test(navigation),
  ],
  [
    'Loads the URL-selected member',
    /userId/.test(page) &&
      /user\.byId/.test(profile) &&
      /information\.useQuery\(\s*\{ userId \}/.test(profile),
  ],
  [
    'Protects profile lookups',
    /byId: protectedProcedure/.test(userRouter) &&
      /userId: z\.uuid\(\)/.test(userRouter),
  ],
  [
    'Restricts editing to the profile owner',
    /currentUser\.data\?\.id === userId/.test(profile) &&
      /\{isOwner \? \(/.test(profile),
  ],
  [
    'Uses Shadcn surfaces',
    /<Card[\s>]/.test(profile) && /<Avatar[\s>]/.test(profile),
  ],
  [
    'Supports narrow and wide layouts',
    /sm:flex-row/.test(profile) && /lg:grid-cols-/.test(profile),
  ],
  [
    'Has actionable contact links',
    /mailto:/.test(profile) && /tel:/.test(profile),
  ],
  [
    'Opens a complete address in maps',
    /postcode/.test(profile) && /google\.com\/maps/.test(profile),
  ],
  [
    'Shows all legacy member fields',
    /birthDate/.test(profile) &&
      /bondNumber/.test(profile) &&
      /refereeLicense/.test(profile),
  ],
  [
    'Shows team and committee history',
    /teamMemberships/.test(profile) && /committeeMemberships/.test(profile),
  ],
  [
    'Resolves membership names',
    /teamNames\.get/.test(profile) && /committeeNames\.get/.test(profile),
  ],
  [
    'Covers loading, failure, and empty states',
    /ProfileSkeleton/.test(profile) &&
      /ProfileError/.test(profile) &&
      /noActivities/.test(profile),
  ],
  [
    'Supports Dutch and English',
    /Mijn profiel/.test(translations) && /My profile/.test(translations),
  ],
];
const passing = criteria.filter(([, passed]) => passed).length;
const score = Math.round((passing / criteria.length) * 100);
for (const [criterion, passed] of criteria) {
  console.log((passed ? 'PASS ' : 'FAIL ') + criterion);
}
if (score < 90) {
  throw new Error(
    'Profile UX eval scored ' + score + '; required score is 90.',
  );
}
console.log('Profile UX eval passed with ' + score + '/100.');
