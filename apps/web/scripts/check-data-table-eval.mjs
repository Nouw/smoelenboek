import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [dataTable, userAdmin, entriesAdmin, standings, pollAdmin] =
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
  ]);

const checks = [
  [
    'TanStack owns the shared core row model and rendering',
    /useReactTable/.test(dataTable) &&
      /getCoreRowModel/.test(dataTable) &&
      /flexRender/.test(dataTable),
  ],
  [
    'No sorting, filtering, pagination, selection, or visibility state was introduced',
    !/getSortedRowModel|getFilteredRowModel|getPaginationRowModel|rowSelection|columnVisibility/.test(
      dataTable,
    ),
  ],
  [
    'User search, empty state, and invitation resend remain intact',
    /query, limit: 100, offset: 0/.test(userAdmin) &&
      /resend\.mutate/.test(userAdmin) &&
      /text\.empty/.test(userAdmin),
  ],
  [
    'User rows retain the stacked responsive presentation',
    /presentation="stacked"/.test(userAdmin) &&
      /md:table-header-group/.test(dataTable) &&
      /grid gap-2/.test(dataTable),
  ],
  [
    'Entries retain CSV, localized time, payment, and score behavior',
    /entriesToCsv/.test(entriesAdmin) &&
      /formatDateTime\(row\.original\.updatedAt, locale\)/.test(entriesAdmin) &&
      /paymentClaimed/.test(entriesAdmin) &&
      /tabular-nums/.test(entriesAdmin),
  ],
  [
    'Entries remain horizontally scrollable at the existing width',
    /presentation="scroll"/.test(entriesAdmin) &&
      /min-w-\[44rem\]/.test(entriesAdmin) &&
      /overflow-x-auto/.test(dataTable),
  ],
  [
    'Standings retain backend order, tied ranks, medals, and points',
    /presentation="compact"/.test(standings) &&
      /row\.original\.rank/.test(standings) &&
      /<Medal/.test(standings) &&
      /row\.original\.totalPoints/.test(standings) &&
      !/sort\(/.test(standings),
  ],
  [
    'Poll voters retain member details and selected-option labels',
    /presentation="scroll"/.test(pollAdmin) &&
      /row\.original\.user\.name/.test(pollAdmin) &&
      /row\.original\.user\.email/.test(pollAdmin) &&
      /row\.original\.optionIds/.test(pollAdmin),
  ],
  [
    'All tables expose semantic captions and column headers',
    /<caption className="sr-only">/.test(dataTable) &&
      /scope="col"/.test(dataTable),
  ],
  [
    'Existing loading, error, and empty branches remain present',
    /users\.isLoading/.test(userAdmin) &&
      /users\.isError/.test(userAdmin) &&
      /entries\.length === 0/.test(entriesAdmin) &&
      /standings\.length === 0/.test(standings),
  ],
];

for (const [name, passed] of checks) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
}
assert.ok(
  checks.every(([, passed]) => passed),
  'Data-table migration eval failed.',
);
console.log(
  `Data-table migration eval passed with ${checks.length}/${checks.length}.`,
);
