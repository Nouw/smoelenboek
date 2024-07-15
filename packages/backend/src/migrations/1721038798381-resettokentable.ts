import { MigrationInterface, QueryRunner } from 'typeorm';

export class Resettokentable1721038798381 implements MigrationInterface {
  name = 'Resettokentable1721038798381';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`reset_token\` (\`id\` int NOT NULL AUTO_INCREMENT, \`token\` varchar(255) NOT NULL, \`created\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`userId\` int NULL, UNIQUE INDEX \`REL_1d61419c157e5325204cbee7a2\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`document\` CHANGE \`originalName\` \`originalName\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reset_token\` ADD CONSTRAINT \`FK_1d61419c157e5325204cbee7a28\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`reset_token\` DROP FOREIGN KEY \`FK_1d61419c157e5325204cbee7a28\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`document\` CHANGE \`originalName\` \`originalName\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `DROP INDEX \`REL_1d61419c157e5325204cbee7a2\` ON \`reset_token\``,
    );
    await queryRunner.query(`DROP TABLE \`reset_token\``);
  }
}
