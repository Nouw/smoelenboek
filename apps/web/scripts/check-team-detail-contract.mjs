import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [grid, page, detail, router, translations] = await Promise.all([
  readFile(new URL('app/teams/team-grid.tsx', root), 'utf8'),
  readFile(new URL('app/teams/[teamId]/page.tsx', root), 'utf8'),
  readFile(new URL('app/teams/[teamId]/team-detail.tsx', root), 'utf8'),
  readFile(
    new URL('../../packages/rpc/src/teams/trpc/team.router.ts', root),
    'utf8',
  ),
  readFile(new URL('lib/i18n.tsx', root), 'utf8'),
]);

assert.match(grid, /href={`\/teams\/\${team\.id}`}/);
assert.match(page, /z\.uuid\(\)\.safeParse\(teamId\)/);
assert.match(page, /notFound\(\)/);
assert.match(detail, /teams\.currentRoster\.useQuery/);
assert.match(detail, /href={`\/profile\/\${member\.userId}`}/);
assert.match(detail, /roster\.isLoading/);
assert.match(detail, /roster\.isError/);
assert.match(detail, /!roster\.data/);
assert.match(detail, /members\.length === 0/);
assert.match(router, /currentRoster: protectedProcedure/);
assert.match(router, /teamId: z\.uuid\(\)/);
assert.match(translations, /Huidig seizoen/);
assert.match(translations, /Current season/);

console.log('Team detail contract passed.');
