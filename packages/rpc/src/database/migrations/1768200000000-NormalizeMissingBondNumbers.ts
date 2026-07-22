import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeMissingBondNumbers1768200000000
  implements MigrationInterface
{
  name = 'NormalizeMissingBondNumbers1768200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "user_information"
      SET "bondNumber" = NULL,
          "updatedAt" = now()
      WHERE btrim("bondNumber") = '-'
    `);
  }

  public down(): Promise<void> {
    // NULL does not reveal whether the old value was '-' or genuinely absent.
    return Promise.resolve();
  }
}
