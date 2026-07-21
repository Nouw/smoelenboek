import { MigrationInterface, QueryRunner } from 'typeorm';

const UUID_PATTERN =
  '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

export class FixBetterAuthIdDefaults1767300000000
  implements MigrationInterface
{
  name = 'FixBetterAuthIdDefaults1767300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['session', 'account', 'verification', 'apikey']) {
      await queryRunner.query(`
        ALTER TABLE "${table}"
          ALTER COLUMN "id" TYPE uuid
          USING (
            CASE
              WHEN "id"::text ~* '${UUID_PATTERN}' THEN "id"::text::uuid
              ELSE gen_random_uuid()
            END
          )
      `);
      await queryRunner.query(`
        ALTER TABLE "${table}"
          ALTER COLUMN "id" SET DEFAULT gen_random_uuid()
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['apikey', 'verification', 'account', 'session']) {
      await queryRunner.query(`
        ALTER TABLE "${table}"
          ALTER COLUMN "id" DROP DEFAULT
      `);
      await queryRunner.query(`
        ALTER TABLE "${table}"
          ALTER COLUMN "id" TYPE text
          USING "id"::text
      `);
    }
  }
}
