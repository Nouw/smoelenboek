import { MigrationInterface, QueryRunner } from "typeorm";

export class ProtototoPredictionExternal1727536364164 implements MigrationInterface {
    name = 'ProtototoPredictionExternal1727536364164'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`protototo_prediction_external\` (\`id\` int NOT NULL AUTO_INCREMENT, \`firstName\` varchar(255) NOT NULL, \`lastName\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`setOne\` tinyint NOT NULL, \`setTwo\` tinyint NOT NULL, \`setThree\` tinyint NOT NULL, \`setFour\` tinyint NULL, \`setFive\` tinyint NULL, \`matchId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`protototo_prediction_external\` ADD CONSTRAINT \`FK_eae5d57318757e3d479b6447297\` FOREIGN KEY (\`matchId\`) REFERENCES \`protototo_match\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`protototo_prediction_external\` DROP FOREIGN KEY \`FK_eae5d57318757e3d479b6447297\``);
        await queryRunner.query(`DROP TABLE \`protototo_prediction_external\``);
    }

}
