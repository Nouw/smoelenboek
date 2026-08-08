import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [dataTable, userAdmin, entriesAdmin, standings, pollAdmin, uiPackage] =
  await Promise.all([
    readFile(
      new URL('../../packages/ui/src/components/data-table.tsx', root),
      'utf8',
    ),
    readFile(new URL('app/users/admin/user-admin-content.tsx', root), 'utf8'),
    readFile(
      new URL('app/protototo/admin/protototo-admin-content.tsx', root),
      'utf8',
    ),
    readFile(
      new URL('app/protototo/standings/standings-content.tsx', root),
      'utf8',
    ),
    readFile(
      new URL('app/polls/admin/[pollId]/poll-admin-detail.tsx', root),
      'utf8',
    ),
    readFile(new URL('../../packages/ui/package.json', root), 'utf8'),
  ]);

assert.match(uiPackage, /"@tanstack\/react-table"/);
assert.match(dataTable, /useReactTable/);
assert.match(dataTable, /getCoreRowModel/);
assert.match(dataTable, /flexRender/);
assert.match(dataTable, /type DataTableColumnDef/);
assert.match(dataTable, /'scroll' \| 'stacked' \| 'compact'/);
assert.match(dataTable, /getRowId/);
assert.match(dataTable, /<caption className="sr-only">/);

function section(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex);
  assert.ok(startIndex >= 0 && endIndex > startIndex, `Missing ${start} block`);
  return source.slice(startIndex, endIndex);
}

const userColumns = section(userAdmin, 'const userColumns', 'if (currentUser');
const entryColumns = section(
  entriesAdmin,
  'const entryColumns',
  'function downloadCsv',
);
const standingColumns = section(
  standings,
  'const standingColumns',
  'if (roundsQuery',
);
const voterColumns = section(pollAdmin, 'const voterColumns', 'return (');

for (const [name, source, presentation] of [
  ['user administration', userAdmin, 'stacked'],
  ['Protototo entries', entriesAdmin, 'scroll'],
  ['standings', standings, 'compact'],
  ['poll voters', pollAdmin, 'scroll'],
]) {
  assert.match(source, /<DataTable/, `${name} must use DataTable`);
  assert.ok(
    source.includes(`presentation="${presentation}"`),
    `${name} must use the ${presentation} presentation`,
  );
  assert.match(source, /getRowId=/, `${name} must define stable row IDs`);
}

for (const column of [
  'name',
  'email',
  'preferredLocale',
  'invitationStatus',
  'actions',
]) {
  assert.ok(userColumns.includes(column), `User table missing ${column}`);
}
assert.match(userColumns, /resend\.mutate/);

for (const column of [
  'displayName',
  'participantType',
  'email',
  'paid',
  'updatedAt',
  'totalPoints',
]) {
  assert.ok(entryColumns.includes(column), `Entries table missing ${column}`);
}
assert.match(entriesAdmin, /entriesToCsv/);

for (const column of ['rank', 'displayName', 'totalPoints']) {
  assert.ok(
    standingColumns.includes(column),
    `Standings table missing ${column}`,
  );
}
assert.match(standingColumns, /<Medal/);
assert.match(voterColumns, /row\.original\.user\.name/);
assert.match(voterColumns, /row\.original\.optionIds/);

async function collectTsx(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = new URL(
        `${entry.name}${entry.isDirectory() ? '/' : ''}`,
        directory,
      );
      if (entry.isDirectory()) return collectTsx(path);
      return entry.name.endsWith('.tsx') ? [path] : [];
    }),
  );
  return files.flat();
}

const frontendFiles = (
  await Promise.all([
    collectTsx(new URL('app/', root)),
    collectTsx(new URL('components/', root)),
  ])
).flat();
for (const file of frontendFiles) {
  const source = await readFile(file, 'utf8');
  assert.doesNotMatch(
    source,
    /<table\b/,
    `Raw table markup is only allowed in the shared DataTable: ${file.pathname}`,
  );
}

console.log('Frontend data-table contract passed.');
