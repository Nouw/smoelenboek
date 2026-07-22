import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserInformation1768000000000 implements MigrationInterface {
  name = 'CreateUserInformation1768000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_information" (
        "userId" uuid NOT NULL,
        "streetName" character varying,
        "houseNumber" character varying,
        "postcode" character varying,
        "city" character varying,
        "phoneNumber" character varying,
        "bankAccountNumber" character varying,
        "birthDate" date,
        "bondNumber" character varying,
        "joinDate" date,
        "leaveDate" date,
        "backNumber" smallint,
        "refereeLicense" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_information_userId" PRIMARY KEY ("userId"),
        CONSTRAINT "UQ_user_information_bondNumber" UNIQUE ("bondNumber"),
        CONSTRAINT "CHK_user_information_membership_dates" CHECK (
          "joinDate" IS NULL
          OR "leaveDate" IS NULL
          OR "leaveDate" >= "joinDate"
        ),
        CONSTRAINT "CHK_user_information_backNumber" CHECK (
          "backNumber" IS NULL OR "backNumber" >= 0
        ),
        CONSTRAINT "FK_user_information_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "user_information"');
  }
}
