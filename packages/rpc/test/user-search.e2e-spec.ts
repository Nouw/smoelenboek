import { DataSource } from 'typeorm';
import { UserEntity } from '../src/users/entities/user.entity';
import { UsersRepository } from '../src/users/repositories/users.repository';

// eslint-disable-next-line turbo/no-undeclared-env-vars
const databaseUrl = process.env.TEST_USER_SEARCH_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase('user search PostgreSQL regression', () => {
  const dataSource = new DataSource({ type: 'postgres', url: databaseUrl, entities: [UserEntity] });
  let runner: ReturnType<DataSource['createQueryRunner']>;
  let repository: UsersRepository;

  beforeAll(async () => {
    await dataSource.initialize();
    runner = dataSource.createQueryRunner();
    await runner.connect();
    // Temporary tables are private to this connection and disappear on disconnect.
    await runner.query(`CREATE TEMP TABLE users (
      id uuid PRIMARY KEY, "authUserId" varchar, email varchar, "emailVerified" boolean DEFAULT false,
      name varchar, "firstName" varchar, "lastName" varchar, "imageUrl" varchar,
      role varchar DEFAULT 'user', "preferredLocale" varchar DEFAULT 'nl', "invitedAt" timestamptz,
      "accountActivatedAt" timestamptz, banned boolean DEFAULT false,
      "passwordMigrationRequired" boolean DEFAULT false, "banReason" varchar, "banExpires" timestamptz,
      "createdAt" timestamptz DEFAULT now(), "updatedAt" timestamptz DEFAULT now()
    )`);
    await runner.query('CREATE TEMP TABLE user_information ("userId" uuid PRIMARY KEY, "leaveDate" date)');
    await runner.query(`INSERT INTO users (id, name, "firstName", "lastName", email) VALUES
      ('00000000-0000-4000-8000-000000000001', 'Display', 'Alice', 'Smith', 'alice@example.test'),
      ('00000000-0000-4000-8000-000000000002', 'Alice inactive', 'Alice', 'Former', 'former@example.test')`);
    await runner.query(`INSERT INTO user_information VALUES ('00000000-0000-4000-8000-000000000002', CURRENT_DATE)`);
    repository = new UsersRepository(runner.manager.getRepository(UserEntity));
  });

  afterAll(async () => {
    if (runner) await runner.release();
    if (dataSource.isInitialized) await dataSource.destroy();
  });

  it.each([' Alice ', 'smith', 'display', 'alice@example.test', ''])('searches %j and excludes former members', async (term: string) => {
    expect((await repository.search(term)).map((user) => user.id))
      .toEqual(['00000000-0000-4000-8000-000000000001']);
  });

  it('binds SQL-like input and honors the result limit', async () => {
    expect(await repository.search("' OR 1=1 --")).toEqual([]);
    expect(await repository.search('', 1)).toHaveLength(1);
  });
});
