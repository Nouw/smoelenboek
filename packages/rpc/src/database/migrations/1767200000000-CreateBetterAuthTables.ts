import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBetterAuthTables1767200000000
  implements MigrationInterface
{
  name = 'CreateBetterAuthTables1767200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP CONSTRAINT IF EXISTS "UQ_users_clerkUserId"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        RENAME COLUMN "clerkUserId" TO "authUserId"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "authUserId" DROP NOT NULL,
        ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "name" character varying NOT NULL DEFAULT ''
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "UQ_users_authUserId" UNIQUE ("authUserId")
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD CONSTRAINT "UQ_users_email" UNIQUE ("email")
    `);

    await queryRunner.query(`
      CREATE TABLE "session" (
        "id" text NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "token" text NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "ipAddress" text,
        "userAgent" text,
        "userId" uuid NOT NULL,
        CONSTRAINT "UQ_session_token" UNIQUE ("token"),
        CONSTRAINT "PK_session_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_session_userId" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_session_userId" ON "session" ("userId")
    `);

    await queryRunner.query(`
      CREATE TABLE "account" (
        "id" text NOT NULL,
        "accountId" text NOT NULL,
        "providerId" text NOT NULL,
        "userId" uuid NOT NULL,
        "accessToken" text,
        "refreshToken" text,
        "idToken" text,
        "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
        "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
        "scope" text,
        "password" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_account_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_account_userId" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_account_userId" ON "account" ("userId")
    `);

    await queryRunner.query(`
      CREATE TABLE "verification" (
        "id" text NOT NULL,
        "identifier" text NOT NULL,
        "value" text NOT NULL,
        "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_verification_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "apikey" (
        "id" text NOT NULL,
        "configId" text NOT NULL DEFAULT 'default',
        "name" text,
        "start" text,
        "prefix" text,
        "key" text NOT NULL,
        "referenceId" text NOT NULL,
        "refillInterval" integer,
        "refillAmount" integer,
        "lastRefillAt" TIMESTAMP WITH TIME ZONE,
        "enabled" boolean NOT NULL DEFAULT true,
        "rateLimitEnabled" boolean NOT NULL DEFAULT true,
        "rateLimitTimeWindow" integer NOT NULL DEFAULT 86400000,
        "rateLimitMax" integer NOT NULL DEFAULT 10,
        "requestCount" integer NOT NULL DEFAULT 0,
        "remaining" integer,
        "lastRequest" TIMESTAMP WITH TIME ZONE,
        "expiresAt" TIMESTAMP WITH TIME ZONE,
        "permissions" text,
        "metadata" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_apikey_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_apikey_configId" ON "apikey" ("configId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_apikey_referenceId" ON "apikey" ("referenceId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_apikey_key" ON "apikey" ("key")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "apikey"');
    await queryRunner.query('DROP TABLE "verification"');
    await queryRunner.query('DROP TABLE "account"');
    await queryRunner.query('DROP TABLE "session"');
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP CONSTRAINT IF EXISTS "UQ_users_email"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP CONSTRAINT IF EXISTS "UQ_users_authUserId"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "name",
        DROP COLUMN "emailVerified"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        RENAME COLUMN "authUserId" TO "clerkUserId"
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "clerkUserId" SET NOT NULL,
        ADD CONSTRAINT "UQ_users_clerkUserId" UNIQUE ("clerkUserId")
    `);
  }
}
