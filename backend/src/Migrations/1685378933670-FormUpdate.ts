import { MigrationInterface, QueryRunner } from "typeorm";

export class FormUpdate1685378933670 implements MigrationInterface {
    name = 'FormUpdate1685378933670'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`form\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`form\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`form\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`form\` CHANGE \`description\` \`description\` json NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`form\` CHANGE \`description\` \`description\` json NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`form\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`form\` ADD \`id\` varchar(36) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`form\` ADD PRIMARY KEY (\`id\`)`);
    }

}
