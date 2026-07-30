import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDocuments1768700000000 implements MigrationInterface {
  name = 'CreateDocuments1768700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "content_collections" (
        "id" uuid NOT NULL,
        "name" character varying(160) NOT NULL,
        "description" text,
        "kind" character varying NOT NULL,
        "seasonKey" smallint NOT NULL,
        "position" integer NOT NULL,
        "coverAssetId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_content_collections_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_content_collections_scope_position"
          UNIQUE ("seasonKey", "kind", "position") DEFERRABLE INITIALLY DEFERRED,
        CONSTRAINT "CHK_content_collections_kind" CHECK ("kind" IN ('photo_album', 'document_library')),
        CONSTRAINT "CHK_content_collections_season" CHECK ("seasonKey" BETWEEN 1900 AND 3000),
        CONSTRAINT "CHK_content_collections_position" CHECK ("position" >= 0)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_content_collections_scope_position" ON "content_collections" ("seasonKey" DESC, "kind", "position")',
    );
    await queryRunner.query(`
      CREATE TABLE "content_assets" (
        "id" uuid NOT NULL,
        "collectionId" uuid NOT NULL,
        "objectName" character varying NOT NULL,
        "thumbnailObjectName" character varying,
        "originalName" character varying(255) NOT NULL,
        "mimeType" character varying(160) NOT NULL,
        "byteSize" bigint NOT NULL,
        "title" character varying(240),
        "caption" text,
        "position" integer NOT NULL,
        "uploadedBy" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_content_assets_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_content_assets_collection_position"
          UNIQUE ("collectionId", "position") DEFERRABLE INITIALLY DEFERRED,
        CONSTRAINT "UQ_content_assets_object" UNIQUE ("objectName"),
        CONSTRAINT "UQ_content_assets_thumbnail" UNIQUE ("thumbnailObjectName"),
        CONSTRAINT "CHK_content_assets_size" CHECK ("byteSize" >= 0),
        CONSTRAINT "CHK_content_assets_position" CHECK ("position" >= 0),
        CONSTRAINT "FK_content_assets_collection" FOREIGN KEY ("collectionId") REFERENCES "content_collections"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_content_assets_uploader" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_content_assets_collection_position" ON "content_assets" ("collectionId", "position")',
    );
    await queryRunner.query(`
      ALTER TABLE "content_collections"
      ADD CONSTRAINT "FK_content_collections_cover"
      FOREIGN KEY ("coverAssetId") REFERENCES "content_assets"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      CREATE TABLE "content_object_cleanup" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "objectName" character varying NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "lastError" text,
        "nextAttemptAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_content_object_cleanup_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_content_object_cleanup_object" UNIQUE ("objectName"),
        CONSTRAINT "CHK_content_object_cleanup_attempts" CHECK ("attempts" >= 0)
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_content_object_cleanup_due" ON "content_object_cleanup" ("nextAttemptAt", "createdAt")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_content_object_cleanup_due"');
    await queryRunner.query('DROP TABLE "content_object_cleanup"');
    await queryRunner.query(
      'ALTER TABLE "content_collections" DROP CONSTRAINT "FK_content_collections_cover"',
    );
    await queryRunner.query('DROP INDEX "IDX_content_assets_collection_position"');
    await queryRunner.query('DROP TABLE "content_assets"');
    await queryRunner.query('DROP INDEX "IDX_content_collections_scope_position"');
    await queryRunner.query('DROP TABLE "content_collections"');
  }
}
