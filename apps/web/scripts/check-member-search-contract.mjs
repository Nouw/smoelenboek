import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [header, search, translations, userRouter] = await Promise.all([
  readFile(new URL('components/site-header.tsx', root), 'utf8'),
  readFile(new URL('components/member-search.tsx', root), 'utf8'),
  readFile(new URL('lib/i18n.tsx', root), 'utf8'),
  readFile(
    new URL('../../packages/rpc/src/users/trpc/user.router.ts', root),
    'utf8',
  ),
]);

assert.match(header, /<MemberSearch\s*\/>/);
assert.match(userRouter, /search: protectedProcedure/);
assert.doesNotMatch(userRouter, /search: adminProcedure/);
assert.match(search, /trpc\.user\.search\.useQuery/);
assert.match(search, /enabled: canSearch/);
assert.match(search, /debounceMilliseconds = 250/);
assert.match(search, /router\.push\(`\/profile\/\$\{userId\}`\)/);
assert.match(search, /<Link[\s\S]*href=\{`\/profile\/\$\{user\.id\}`\}/);
assert.match(
  search,
  /onPointerDown=\{\(event\) => event\.preventDefault\(\)\}/,
  'Pointer-down must not blur the input and unmount a result before its click navigates.',
);
assert.match(search, /role="combobox"/);
assert.match(search, /role="listbox"/);
assert.match(search, /role="option"/);
assert.match(search, /event\.key === 'ArrowDown'/);
assert.match(search, /event\.key === 'Escape'/);
for (const copy of [
  'Zoek leden',
  'Search members',
  'Geen leden gevonden',
  'No members found',
]) {
  assert.ok(translations.includes(copy), `Missing member search copy: ${copy}`);
}

console.log('Member search contract passed.');
