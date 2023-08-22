import { MigrationInterface, QueryRunner } from "typeorm";

export class FormSync1685378815515 implements MigrationInterface {
    name = 'FormSync1685378815515'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`path\` varchar(255) NOT NULL, \`categoryId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`category\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`pinned\` tinyint NOT NULL DEFAULT 0, \`type\` enum ('documents', 'photos') NOT NULL DEFAULT 'photos', \`created\` date NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`form\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` json NOT NULL, \`registrationOpen\` timestamp NOT NULL, \`registrationClosed\` timestamp NOT NULL, \`formItem\` blob NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`permission\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_240853a0c3353c25fb12434ad3\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`role\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_ae4578dcaed5adff96595e6166\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`team\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`rank\` text NOT NULL, \`image\` text NULL, \`gender\` text NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`season\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`startDate\` date NOT NULL, \`endDate\` date NOT NULL, \`current\` tinyint NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_team_season\` (\`id\` int NOT NULL AUTO_INCREMENT, \`function\` text NOT NULL, \`userId\` int NULL, \`teamId\` int NULL, \`seasonId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`protototo_predictions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`setOne\` tinyint NOT NULL, \`setTwo\` tinyint NOT NULL, \`setThree\` tinyint NOT NULL, \`setFour\` tinyint NULL, \`setFive\` tinyint NULL, \`matchId\` int NULL, \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`protototo_match\` (\`id\` int NOT NULL AUTO_INCREMENT, \`playDate\` timestamp NOT NULL, \`homeTeam\` varchar(255) NOT NULL, \`awayTeam\` varchar(255) NOT NULL, \`location\` varchar(255) NOT NULL, \`gender\` varchar(255) NOT NULL, \`seasonId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`protototo_season\` (\`id\` int NOT NULL AUTO_INCREMENT, \`start\` timestamp NOT NULL, \`end\` timestamp NOT NULL, \`tikkie\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`protototo_prediction_results\` (\`id\` int NOT NULL AUTO_INCREMENT, \`points\` int NOT NULL, \`userId\` int NULL, \`seasonId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`activity\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`location\` varchar(255) NOT NULL, \`description\` text NULL, \`date\` timestamp NOT NULL, \`registrationEnd\` timestamp NOT NULL, \`registrationOpen\` timestamp NOT NULL, \`max\` int NOT NULL DEFAULT '0', \`forms\` text NULL, \`formId\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`firstName\` varchar(255) NOT NULL, \`lastName\` varchar(255) NOT NULL, \`streetName\` varchar(255) NOT NULL, \`houseNumber\` varchar(255) NOT NULL, \`postcode\` varchar(255) NOT NULL, \`city\` varchar(255) NOT NULL, \`phoneNumber\` varchar(255) NOT NULL, \`bankaccountNumber\` varchar(255) NOT NULL, \`birthDate\` date NOT NULL, \`bondNumber\` varchar(255) NOT NULL, \`joinDate\` date NOT NULL, \`leaveDate\` date NULL, \`backNumber\` int NULL, \`profilePicture\` varchar(255) NULL DEFAULT 'user/default.jpg', \`refereeLicense\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_committee_season\` (\`id\` int NOT NULL AUTO_INCREMENT, \`function\` text NOT NULL, \`userId\` int NULL, \`committeeId\` int NULL, \`seasonId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`committee\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, \`image\` text NULL, \`email\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`photobook\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`photo\` (\`id\` int NOT NULL AUTO_INCREMENT, \`file\` text NOT NULL, \`photobookId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`protototo_predictions_external\` (\`id\` int NOT NULL AUTO_INCREMENT, \`firstName\` varchar(255) NOT NULL, \`lastName\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`setOne\` tinyint NOT NULL, \`setTwo\` tinyint NOT NULL, \`setThree\` tinyint NOT NULL, \`setFour\` tinyint NULL, \`setFive\` tinyint NULL, \`matchId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`protototo_results\` (\`id\` int NOT NULL AUTO_INCREMENT, \`setOne\` tinyint NOT NULL, \`setTwo\` tinyint NOT NULL, \`setThree\` tinyint NOT NULL, \`setFour\` tinyint NULL, \`setFive\` tinyint NULL, \`matchId\` int NULL, UNIQUE INDEX \`REL_c1293f33ae02368bf9f829d418\` (\`matchId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`role_permissions_permission\` (\`roleId\` int NOT NULL, \`permissionId\` int NOT NULL, INDEX \`IDX_b36cb2e04bc353ca4ede00d87b\` (\`roleId\`), INDEX \`IDX_bfbc9e263d4cea6d7a8c9eb3ad\` (\`permissionId\`), PRIMARY KEY (\`roleId\`, \`permissionId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`activity_users_user\` (\`activityId\` int NOT NULL, \`userId\` int NOT NULL, INDEX \`IDX_69f8497403a4a93984511a0769\` (\`activityId\`), INDEX \`IDX_34ab5afd90dfbcc6318e8bf21f\` (\`userId\`), PRIMARY KEY (\`activityId\`, \`userId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_roles_role\` (\`userId\` int NOT NULL, \`roleId\` int NOT NULL, INDEX \`IDX_5f9286e6c25594c6b88c108db7\` (\`userId\`), INDEX \`IDX_4be2f7adf862634f5f803d246b\` (\`roleId\`), PRIMARY KEY (\`userId\`, \`roleId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user_activities_activity\` (\`userId\` int NOT NULL, \`activityId\` int NOT NULL, INDEX \`IDX_4c7177be941e82e49f2b41ff2a\` (\`userId\`), INDEX \`IDX_5ea183e4f153342891a0f75373\` (\`activityId\`), PRIMARY KEY (\`userId\`, \`activityId\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`file\` ADD CONSTRAINT \`FK_3f49c0ffff0c98a80ed4fade64c\` FOREIGN KEY (\`categoryId\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` ADD CONSTRAINT \`FK_d07eeb38e9ea5a1d93c7a76c94d\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` ADD CONSTRAINT \`FK_b232d2ec8962db43e0f99012078\` FOREIGN KEY (\`teamId\`) REFERENCES \`team\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` ADD CONSTRAINT \`FK_b25142ab0433134a988dc0cbf00\` FOREIGN KEY (\`seasonId\`) REFERENCES \`season\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`protototo_predictions\` ADD CONSTRAINT \`FK_b61302f1fc65919e31286e8eee8\` FOREIGN KEY (\`matchId\`) REFERENCES \`protototo_match\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`protototo_predictions\` ADD CONSTRAINT \`FK_8d5248b942172767bc0c90289f9\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`protototo_match\` ADD CONSTRAINT \`FK_8005059cf1df9fb624f3a85d4ff\` FOREIGN KEY (\`seasonId\`) REFERENCES \`protototo_season\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`protototo_prediction_results\` ADD CONSTRAINT \`FK_3605754fd5efcec4ca1a90dd0fa\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`protototo_prediction_results\` ADD CONSTRAINT \`FK_8a17d7d4ef07d6c72ec3b242bbb\` FOREIGN KEY (\`seasonId\`) REFERENCES \`protototo_season\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_committee_season\` ADD CONSTRAINT \`FK_a8730d10fa3d3769032dbdb9edc\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_committee_season\` ADD CONSTRAINT \`FK_a225675f3f6c3cd47f1e7e1d108\` FOREIGN KEY (\`committeeId\`) REFERENCES \`committee\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_committee_season\` ADD CONSTRAINT \`FK_b44931e93ece3a4843d63fcd955\` FOREIGN KEY (\`seasonId\`) REFERENCES \`season\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`photo\` ADD CONSTRAINT \`FK_abcfd2ccc51efd0bafa11ef9b43\` FOREIGN KEY (\`photobookId\`) REFERENCES \`photobook\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`protototo_predictions_external\` ADD CONSTRAINT \`FK_68f5fae3e3e8c04517dfe9ead81\` FOREIGN KEY (\`matchId\`) REFERENCES \`protototo_match\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`protototo_results\` ADD CONSTRAINT \`FK_c1293f33ae02368bf9f829d4187\` FOREIGN KEY (\`matchId\`) REFERENCES \`protototo_match\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`role_permissions_permission\` ADD CONSTRAINT \`FK_b36cb2e04bc353ca4ede00d87b9\` FOREIGN KEY (\`roleId\`) REFERENCES \`role\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`role_permissions_permission\` ADD CONSTRAINT \`FK_bfbc9e263d4cea6d7a8c9eb3ad2\` FOREIGN KEY (\`permissionId\`) REFERENCES \`permission\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`activity_users_user\` ADD CONSTRAINT \`FK_69f8497403a4a93984511a07699\` FOREIGN KEY (\`activityId\`) REFERENCES \`activity\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`activity_users_user\` ADD CONSTRAINT \`FK_34ab5afd90dfbcc6318e8bf21f3\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_roles_role\` ADD CONSTRAINT \`FK_5f9286e6c25594c6b88c108db77\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`user_roles_role\` ADD CONSTRAINT \`FK_4be2f7adf862634f5f803d246b8\` FOREIGN KEY (\`roleId\`) REFERENCES \`role\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`user_activities_activity\` ADD CONSTRAINT \`FK_4c7177be941e82e49f2b41ff2aa\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`user_activities_activity\` ADD CONSTRAINT \`FK_5ea183e4f153342891a0f753737\` FOREIGN KEY (\`activityId\`) REFERENCES \`activity\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_activities_activity\` DROP FOREIGN KEY \`FK_5ea183e4f153342891a0f753737\``);
        await queryRunner.query(`ALTER TABLE \`user_activities_activity\` DROP FOREIGN KEY \`FK_4c7177be941e82e49f2b41ff2aa\``);
        await queryRunner.query(`ALTER TABLE \`user_roles_role\` DROP FOREIGN KEY \`FK_4be2f7adf862634f5f803d246b8\``);
        await queryRunner.query(`ALTER TABLE \`user_roles_role\` DROP FOREIGN KEY \`FK_5f9286e6c25594c6b88c108db77\``);
        await queryRunner.query(`ALTER TABLE \`activity_users_user\` DROP FOREIGN KEY \`FK_34ab5afd90dfbcc6318e8bf21f3\``);
        await queryRunner.query(`ALTER TABLE \`activity_users_user\` DROP FOREIGN KEY \`FK_69f8497403a4a93984511a07699\``);
        await queryRunner.query(`ALTER TABLE \`role_permissions_permission\` DROP FOREIGN KEY \`FK_bfbc9e263d4cea6d7a8c9eb3ad2\``);
        await queryRunner.query(`ALTER TABLE \`role_permissions_permission\` DROP FOREIGN KEY \`FK_b36cb2e04bc353ca4ede00d87b9\``);
        await queryRunner.query(`ALTER TABLE \`protototo_results\` DROP FOREIGN KEY \`FK_c1293f33ae02368bf9f829d4187\``);
        await queryRunner.query(`ALTER TABLE \`protototo_predictions_external\` DROP FOREIGN KEY \`FK_68f5fae3e3e8c04517dfe9ead81\``);
        await queryRunner.query(`ALTER TABLE \`photo\` DROP FOREIGN KEY \`FK_abcfd2ccc51efd0bafa11ef9b43\``);
        await queryRunner.query(`ALTER TABLE \`user_committee_season\` DROP FOREIGN KEY \`FK_b44931e93ece3a4843d63fcd955\``);
        await queryRunner.query(`ALTER TABLE \`user_committee_season\` DROP FOREIGN KEY \`FK_a225675f3f6c3cd47f1e7e1d108\``);
        await queryRunner.query(`ALTER TABLE \`user_committee_season\` DROP FOREIGN KEY \`FK_a8730d10fa3d3769032dbdb9edc\``);
        await queryRunner.query(`ALTER TABLE \`protototo_prediction_results\` DROP FOREIGN KEY \`FK_8a17d7d4ef07d6c72ec3b242bbb\``);
        await queryRunner.query(`ALTER TABLE \`protototo_prediction_results\` DROP FOREIGN KEY \`FK_3605754fd5efcec4ca1a90dd0fa\``);
        await queryRunner.query(`ALTER TABLE \`protototo_match\` DROP FOREIGN KEY \`FK_8005059cf1df9fb624f3a85d4ff\``);
        await queryRunner.query(`ALTER TABLE \`protototo_predictions\` DROP FOREIGN KEY \`FK_8d5248b942172767bc0c90289f9\``);
        await queryRunner.query(`ALTER TABLE \`protototo_predictions\` DROP FOREIGN KEY \`FK_b61302f1fc65919e31286e8eee8\``);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` DROP FOREIGN KEY \`FK_b25142ab0433134a988dc0cbf00\``);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` DROP FOREIGN KEY \`FK_b232d2ec8962db43e0f99012078\``);
        await queryRunner.query(`ALTER TABLE \`user_team_season\` DROP FOREIGN KEY \`FK_d07eeb38e9ea5a1d93c7a76c94d\``);
        await queryRunner.query(`ALTER TABLE \`file\` DROP FOREIGN KEY \`FK_3f49c0ffff0c98a80ed4fade64c\``);
        await queryRunner.query(`DROP INDEX \`IDX_5ea183e4f153342891a0f75373\` ON \`user_activities_activity\``);
        await queryRunner.query(`DROP INDEX \`IDX_4c7177be941e82e49f2b41ff2a\` ON \`user_activities_activity\``);
        await queryRunner.query(`DROP TABLE \`user_activities_activity\``);
        await queryRunner.query(`DROP INDEX \`IDX_4be2f7adf862634f5f803d246b\` ON \`user_roles_role\``);
        await queryRunner.query(`DROP INDEX \`IDX_5f9286e6c25594c6b88c108db7\` ON \`user_roles_role\``);
        await queryRunner.query(`DROP TABLE \`user_roles_role\``);
        await queryRunner.query(`DROP INDEX \`IDX_34ab5afd90dfbcc6318e8bf21f\` ON \`activity_users_user\``);
        await queryRunner.query(`DROP INDEX \`IDX_69f8497403a4a93984511a0769\` ON \`activity_users_user\``);
        await queryRunner.query(`DROP TABLE \`activity_users_user\``);
        await queryRunner.query(`DROP INDEX \`IDX_bfbc9e263d4cea6d7a8c9eb3ad\` ON \`role_permissions_permission\``);
        await queryRunner.query(`DROP INDEX \`IDX_b36cb2e04bc353ca4ede00d87b\` ON \`role_permissions_permission\``);
        await queryRunner.query(`DROP TABLE \`role_permissions_permission\``);
        await queryRunner.query(`DROP INDEX \`REL_c1293f33ae02368bf9f829d418\` ON \`protototo_results\``);
        await queryRunner.query(`DROP TABLE \`protototo_results\``);
        await queryRunner.query(`DROP TABLE \`protototo_predictions_external\``);
        await queryRunner.query(`DROP TABLE \`photo\``);
        await queryRunner.query(`DROP TABLE \`photobook\``);
        await queryRunner.query(`DROP TABLE \`committee\``);
        await queryRunner.query(`DROP TABLE \`user_committee_season\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP TABLE \`activity\``);
        await queryRunner.query(`DROP TABLE \`protototo_prediction_results\``);
        await queryRunner.query(`DROP TABLE \`protototo_season\``);
        await queryRunner.query(`DROP TABLE \`protototo_match\``);
        await queryRunner.query(`DROP TABLE \`protototo_predictions\``);
        await queryRunner.query(`DROP TABLE \`user_team_season\``);
        await queryRunner.query(`DROP TABLE \`season\``);
        await queryRunner.query(`DROP TABLE \`team\``);
        await queryRunner.query(`DROP INDEX \`IDX_ae4578dcaed5adff96595e6166\` ON \`role\``);
        await queryRunner.query(`DROP TABLE \`role\``);
        await queryRunner.query(`DROP INDEX \`IDX_240853a0c3353c25fb12434ad3\` ON \`permission\``);
        await queryRunner.query(`DROP TABLE \`permission\``);
        await queryRunner.query(`DROP TABLE \`form\``);
        await queryRunner.query(`DROP TABLE \`category\``);
        await queryRunner.query(`DROP TABLE \`file\``);
    }

}
