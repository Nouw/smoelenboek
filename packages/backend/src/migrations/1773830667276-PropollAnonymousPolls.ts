import { MigrationInterface, QueryRunner } from 'typeorm';

export class PropollAnonymousPolls1773830667276 implements MigrationInterface {
  name = 'PropollAnonymousPolls1773830667276';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`propoll\` (\`id\` int NOT NULL AUTO_INCREMENT, \`question\` text NOT NULL, \`allowMultiple\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`propoll_option\` (\`id\` int NOT NULL AUTO_INCREMENT, \`text\` text NOT NULL, \`pollId\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`propoll_vote\` (\`id\` int NOT NULL AUTO_INCREMENT, \`pollId\` int NOT NULL, \`optionId\` int NOT NULL, \`userId\` int NOT NULL, UNIQUE INDEX \`IDX_propoll_vote_poll_user_option\` (\`pollId\`, \`userId\`, \`optionId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`propoll_option\` ADD CONSTRAINT \`FK_propoll_option_poll\` FOREIGN KEY (\`pollId\`) REFERENCES \`propoll\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`propoll_vote\` ADD CONSTRAINT \`FK_propoll_vote_poll\` FOREIGN KEY (\`pollId\`) REFERENCES \`propoll\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`propoll_vote\` ADD CONSTRAINT \`FK_propoll_vote_option\` FOREIGN KEY (\`optionId\`) REFERENCES \`propoll_option\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`propoll_vote\` ADD CONSTRAINT \`FK_propoll_vote_user\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`propoll_vote\` DROP FOREIGN KEY \`FK_propoll_vote_user\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`propoll_vote\` DROP FOREIGN KEY \`FK_propoll_vote_option\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`propoll_vote\` DROP FOREIGN KEY \`FK_propoll_vote_poll\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`propoll_option\` DROP FOREIGN KEY \`FK_propoll_option_poll\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_propoll_vote_poll_user_option\` ON \`propoll_vote\``,
    );
    await queryRunner.query(`DROP TABLE \`propoll_vote\``);
    await queryRunner.query(`DROP TABLE \`propoll_option\``);
    await queryRunner.query(`DROP TABLE \`propoll\``);
  }
}
