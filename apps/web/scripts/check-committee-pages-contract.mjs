import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [grid, page, detail, router, sidebar, translations] = await Promise.all([
  readFile(new URL('app/committees/committee-grid.tsx', root), 'utf8'),
  readFile(new URL('app/committees/[committeeId]/page.tsx', root), 'utf8'),
  readFile(
    new URL('app/committees/[committeeId]/committee-detail.tsx', root),
    'utf8',
  ),
  readFile(
    new URL('../../packages/rpc/src/committees/trpc/committee.router.ts', root),
    'utf8',
  ),
  readFile(new URL('components/app-sidebar.tsx', root), 'utf8'),
  readFile(new URL('lib/i18n.tsx', root), 'utf8'),
]);

assert.match(grid, /committees\.list\.useQuery/);
assert.match(grid, /href={`\/committees\/\${committee\.id}`}/);
assert.match(grid, /committees\.isLoading/);
assert.match(grid, /committees\.isError/);
assert.match(grid, /visibleCommittees\.length === 0/);
assert.match(page, /z\.uuid\(\)\.safeParse\(committeeId\)/);
assert.match(page, /notFound\(\)/);
assert.match(detail, /committees\.currentRoster\.useQuery/);
assert.match(detail, /href={`\/profile\/\${member\.userId}`}/);
assert.match(detail, /roster\.isLoading/);
assert.match(detail, /roster\.isError/);
assert.match(detail, /!roster\.data/);
assert.match(detail, /members\.length === 0/);
assert.match(router, /currentRoster: protectedProcedure/);
assert.match(router, /committeeId: z\.uuid\(\)/);
assert.match(sidebar, /url: "\/committees"/);
assert.match(translations, /Geen commissieleden/);
assert.match(translations, /No committee members/);

console.log('Committee pages contract passed.');
