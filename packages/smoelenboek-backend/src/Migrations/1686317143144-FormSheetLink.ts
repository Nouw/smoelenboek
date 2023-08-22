import { MigrationInterface, QueryRunner } from "typeorm";

export class FormSheetLink1686317143144 implements MigrationInterface {
	name = "FormSheetLink1686317143144";

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query("ALTER TABLE `form` ADD `sheetLink` varchar(255) NOT NULL");
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query("ALTER TABLE `form` DROP COLUMN `sheetLink`");
	}

}
