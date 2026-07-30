import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [list, detail, page, sidebar, translations] = await Promise.all([
  readFile(new URL('app/documents/documents-content.tsx', root), 'utf8'),
  readFile(new URL('app/documents/[collectionId]/document-collection-detail.tsx', root), 'utf8'),
  readFile(new URL('app/documents/[collectionId]/page.tsx', root), 'utf8'),
  readFile(new URL('components/app-sidebar.tsx', root), 'utf8'),
  readFile(new URL('lib/i18n.tsx', root), 'utf8'),
]);

assert.match(list, /documents\.listCollections\.useQuery/);
assert.match(list, /seasons\.list\.useQuery/);
assert.match(list, /new Map<number, Collection\[\]>/);
assert.match(list, /photo_album/);
assert.match(list, /document_library/);
assert.match(list, /reorderCollections\.mutate/);
assert.match(detail, /documents\.getCollection\.useQuery/);
assert.match(detail, /Promise\.all\(Array\.from\(\{ length: Math\.min\(3/);
assert.match(detail, /\/media\/collections\/\$\{collectionId\}\/assets/);
assert.match(detail, /\/media\/assets\/\$\{asset\.id\}\/thumbnail/);
assert.match(detail, /download=1/);
assert.match(detail, /event\.key === 'ArrowLeft'/);
assert.match(detail, /event\.key === 'ArrowRight'/);
assert.match(detail, /setCoverAsset\.useMutation/);
assert.match(detail, /reorderAssets\.useMutation/);
assert.match(page, /z\.uuid\(\)\.safeParse/);
assert.match(page, /notFound\(\)/);
assert.match(sidebar, /url: '\/documents'/);
assert.match(translations, /Documenten en fotoalbums/);
assert.match(translations, /Documents and photo albums/);

console.log('Documents pages contract passed.');
