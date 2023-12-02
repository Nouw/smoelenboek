import { MigrationInterface, QueryRunner } from "typeorm";

export class RoleTypings1701269404450 implements MigrationInterface {
    name = 'RoleTypings1701269404450'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_ae4578dcaed5adff96595e6166\` ON \`role\``);
        await queryRunner.query(`ALTER TABLE \`role\` DROP COLUMN \`name\``);
        await queryRunner.query(`ALTER TABLE \`role\` ADD \`name\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`role\` ADD UNIQUE INDEX \`IDX_ae4578dcaed5adff96595e6166\` (\`name\`)`);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` ADD \`id\` int NOT NULL PRIMARY KEY AUTO_INCREMENT`);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` CHANGE \`function\` \`function\` text NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` ADD CONSTRAINT \`FK_d07eeb38e9ea5a1d93c7a76c94d\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` ADD CONSTRAINT \`FK_b232d2ec8962db43e0f99012078\` FOREIGN KEY (\`teamId\`) REFERENCES \`team\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` ADD CONSTRAINT \`FK_b25142ab0433134a988dc0cbf00\` FOREIGN KEY (\`seasonId\`) REFERENCES \`season\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_team_season\` DROP FOREIGN KEY \`FK_b25142ab0433134a988dc0cbf00\``);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` DROP FOREIGN KEY \`FK_b232d2ec8962db43e0f99012078\``);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` DROP FOREIGN KEY \`FK_d07eeb38e9ea5a1d93c7a76c94d\``);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` CHANGE \`function\` \`function\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` ADD \`id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`role\` DROP INDEX \`IDX_ae4578dcaed5adff96595e6166\``);
        await queryRunner.query(`ALTER TABLE \`role\` DROP COLUMN \`name\``);
        await queryRunner.query(`ALTER TABLE \`role\` ADD \`name\` varchar(255) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_ae4578dcaed5adff96595e6166\` ON \`role\` (\`name\`)`);
    }

}
