import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1766810000000 implements MigrationInterface {
  name = 'CreateUsers1766810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "clerkUserId" character varying NOT NULL,
        "email" character varying,
        "firstName" character varying,
        "lastName" character varying,
        "imageUrl" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_clerkUserId" UNIQUE ("clerkUserId"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "users"');
  }
}
