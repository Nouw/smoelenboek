import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProtototoMatchResult1727209429169 implements MigrationInterface {
  name = 'ProtototoMatchResult1727209429169';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`refresh_token\` DROP FOREIGN KEY \`FK_8e913e288156c133999341156ad\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reset_token\` DROP FOREIGN KEY \`FK_1d61419c157e5325204cbee7a28\``,
    );
    await queryRunner.query(
      `CREATE TABLE \`protototo_match_result\` (\`id\` int NOT NULL AUTO_INCREMENT, \`setOne\` tinyint NOT NULL, \`setTwo\` tinyint NOT NULL, \`setThree\` tinyint NOT NULL, \`setFour\` tinyint NULL, \`setFive\` tinyint NULL, \`matchId\` int NULL, UNIQUE INDEX \`REL_b2ff08a2233a102189453150ef\` (\`matchId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_token\` ADD CONSTRAINT \`FK_8e913e288156c133999341156ad\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reset_token\` ADD CONSTRAINT \`FK_1d61419c157e5325204cbee7a28\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`protototo_match_result\` ADD CONSTRAINT \`FK_b2ff08a2233a102189453150efc\` FOREIGN KEY (\`matchId\`) REFERENCES \`protototo_match\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`protototo_match_result\` DROP FOREIGN KEY \`FK_b2ff08a2233a102189453150efc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reset_token\` DROP FOREIGN KEY \`FK_1d61419c157e5325204cbee7a28\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_token\` DROP FOREIGN KEY \`FK_8e913e288156c133999341156ad\``,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_b2ff08a2233a102189453150ef\` ON \`protototo_match_result\``,
    );
    await queryRunner.query(`DROP TABLE \`protototo_match_result\``);
    await queryRunner.query(
      `ALTER TABLE \`reset_token\` ADD CONSTRAINT \`FK_1d61419c157e5325204cbee7a28\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`refresh_token\` ADD CONSTRAINT \`FK_8e913e288156c133999341156ad\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
