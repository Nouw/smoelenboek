import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateMediaImagesToObjects1767700000000
  implements MigrationInterface
{
  name = 'MigrateMediaImagesToObjects1767700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET "imageUrl" = replace("imageUrl", '/media/images/', '/media/objects/')
      WHERE "imageUrl" LIKE '%/media/images/%'
    `);
    await queryRunner.query(`
      UPDATE "teams"
      SET "imageUrl" = replace("imageUrl", '/media/images/', '/media/objects/')
      WHERE "imageUrl" LIKE '%/media/images/%'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users"
      SET "imageUrl" = replace("imageUrl", '/media/objects/', '/media/images/')
      WHERE "imageUrl" LIKE '%/media/objects/%'
    `);
    await queryRunner.query(`
      UPDATE "teams"
      SET "imageUrl" = replace("imageUrl", '/media/objects/', '/media/images/')
      WHERE "imageUrl" LIKE '%/media/objects/%'
    `);
  }
}
