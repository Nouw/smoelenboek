import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [header, search, translations, userRouter, routerTests, searchHandler] =
  await Promise.all([
    readFile(new URL('components/site-header.tsx', root), 'utf8'),
    readFile(new URL('components/member-search.tsx', root), 'utf8'),
    readFile(new URL('lib/i18n.tsx', root), 'utf8'),
    readFile(
      new URL('../../packages/rpc/src/users/trpc/user.router.ts', root),
      'utf8',
    ),
    readFile(
      new URL('../../packages/rpc/src/users/trpc/user.router.spec.ts', root),
      'utf8',
    ),
    readFile(
      new URL(
        '../../packages/rpc/src/users/queries/search-users.handler.ts',
        root,
      ),
      'utf8',
    ),
  ]);

const criteria = [
  ['Available in the site header', /<MemberSearch\s*\/>/.test(header)],
  [
    'Protected from anonymous callers',
    /search: protectedProcedure/.test(userRouter) &&
      /UNAUTHORIZED/.test(routerTests),
  ],
  [
    'Available to signed-in members',
    /authenticatedContext\('user'\)/.test(routerTests),
  ],
  [
    'Searches by name or email',
    /Search users by name or email/.test(userRouter),
  ],
  ['Avoids a query per keystroke', /debounceMilliseconds = 250/.test(search)],
  [
    'Avoids broad blank searches',
    /minimumQueryLength = 2/.test(search) && /enabled: canSearch/.test(search),
  ],
  [
    'Navigates directly to member profiles',
    /router\.push\(`\/profile\//.test(search),
  ],
  [
    'Supports keyboard selection',
    /ArrowDown/.test(search) &&
      /ArrowUp/.test(search) &&
      /Enter/.test(search) &&
      /Escape/.test(search),
  ],
  [
    'Exposes combobox semantics',
    /role="combobox"/.test(search) && /aria-activedescendant/.test(search),
  ],
  [
    'Covers loading, empty, and error states',
    /users\.isLoading/.test(search) &&
      /users\.isError/.test(search) &&
      /results\.length === 0/.test(search),
  ],
  [
    'Supports Dutch and English',
    /Zoek leden/.test(translations) && /Search members/.test(translations),
  ],
  [
    'Traces result counts without query contents',
    /event: 'users_searched'/.test(searchHandler) &&
      /queryLength/.test(searchHandler) &&
      /resultCount/.test(searchHandler),
  ],
];

const passing = criteria.filter(([, passed]) => passed).length;
const score = Math.round((passing / criteria.length) * 100);
for (const [criterion, passed] of criteria) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${criterion}`);
}
if (score < 90) {
  throw new Error(
    `Member search UX eval scored ${score}; required score is 90.`,
  );
}
console.log(`Member search UX eval passed with ${score}/100.`);
