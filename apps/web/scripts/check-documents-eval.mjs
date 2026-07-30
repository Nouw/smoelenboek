import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [list, detail, translations] = await Promise.all([
  readFile(new URL('app/documents/documents-content.tsx', root), 'utf8'),
  readFile(new URL('app/documents/[collectionId]/document-collection-detail.tsx', root), 'utf8'),
  readFile(new URL('lib/i18n.tsx', root), 'utf8'),
]);

const criteria = [
  ['Collections are grouped newest season first', /right\.seasonKey - left\.seasonKey/.test(list) && /new Map<number, Collection\[\]>/.test(list)],
  ['Photo and document tabs are accessible', /role="tablist"/.test(list) && /aria-selected/.test(list)],
  ['Collection and file search are local', /filterCollections/.test(list) && /filterFiles/.test(detail)],
  ['Admin controls are role-gated', /currentUser\.isAdmin/.test(list) && /currentUser\.isAdmin/.test(detail)],
  ['Ordering has accessible move controls', /moveUp/.test(list) && /moveDown/.test(detail)],
  ['Uploads are bounded to three concurrent requests', /Math\.min\(3, files\.length\)/.test(detail)],
  ['Partial upload failures remain visible', /state: 'error'/.test(detail) && /upload\.error/.test(detail)],
  ['Lightbox supports keyboard navigation and download', /ArrowLeft/.test(detail) && /ArrowRight/.test(detail) && /download=1/.test(detail)],
  ['Document previews and downloads are available', /application\/pdf/.test(detail) && /documents\.preview/.test(detail)],
  ['Permanent deletion requires confirmation', /ConfirmDeleteDialog/.test(list) && /ConfirmDeleteDialog/.test(detail)],
  ['Responsive collection and photo grids are present', /sm:grid-cols-2/.test(list) && /lg:grid-cols-4/.test(detail)],
  ['Dutch and English states are complete', /Uploadvoortgang/.test(translations) && /Upload progress/.test(translations)],
];

const passing = criteria.filter(([, passed]) => passed).length;
const score = Math.round((passing / criteria.length) * 100);
for (const [criterion, passed] of criteria) console.log(`${passed ? 'PASS' : 'FAIL'} ${criterion}`);
if (score < 90) throw new Error(`Documents UX eval scored ${score}; required score is 90.`);
console.log(`Documents UX eval passed with ${score}/100.`);
