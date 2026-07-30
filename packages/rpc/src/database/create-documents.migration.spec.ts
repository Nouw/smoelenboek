import { describe, expect, it, jest } from '@jest/globals';

import { CreateDocuments1768700000000 } from './migrations/1768700000000-CreateDocuments';

describe('CreateDocuments1768700000000', () => {
  it('creates season-scoped collections, assets, and durable cleanup', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new CreateDocuments1768700000000().up({ query } as never);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('CREATE TABLE "content_collections"');
    expect(sql).toContain('CREATE TABLE "content_assets"');
    expect(sql).toContain('CREATE TABLE "content_object_cleanup"');
    expect(sql).toContain('"seasonKey" BETWEEN 1900 AND 3000');
    expect(sql).toContain("'photo_album', 'document_library'");
    expect(sql).toContain('IDX_content_collections_scope_position');
    expect(sql).toContain('UNIQUE ("seasonKey", "kind", "position") DEFERRABLE');
    expect(sql).toContain('UNIQUE ("collectionId", "position") DEFERRABLE');
    expect(sql).toContain('ON DELETE CASCADE');
    expect(sql).toContain('ON DELETE SET NULL');
  });

  it('drops the cover dependency before assets and collections', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await new CreateDocuments1768700000000().down({ query } as never);

    const sql = query.mock.calls.map(([statement]) => statement);
    expect(
      sql.indexOf(
        'ALTER TABLE "content_collections" DROP CONSTRAINT "FK_content_collections_cover"',
      ),
    ).toBeLessThan(sql.indexOf('DROP TABLE "content_assets"'));
    expect(sql.at(-1)).toBe('DROP TABLE "content_collections"');
  });
});
