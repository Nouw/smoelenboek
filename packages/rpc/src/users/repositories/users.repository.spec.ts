import { UsersRepository } from './users.repository';
import { DataSource } from 'typeorm';
import { UserEntity } from '../entities/user.entity';

describe('UsersRepository.search', () => {
  it('lets TypeORM quote every search property, including the reserved user alias', async () => {
    const dataSource = new DataSource({ type: 'postgres', entities: [UserEntity] });
    // Build real entity metadata without opening a database connection.
    await (dataSource as unknown as { buildMetadatas(): Promise<void> }).buildMetadatas();
    const entityRepository = dataSource.getRepository(UserEntity);
    const builder = entityRepository.createQueryBuilder('user');
    jest.spyOn(entityRepository, 'createQueryBuilder').mockReturnValue(builder);
    jest.spyOn(builder, 'getMany').mockResolvedValue([]);

    await new UsersRepository(entityRepository).search('Alice');

    const [sql, parameters] = builder.getQueryAndParameters();
    for (const column of ['name', 'firstName', 'lastName', 'email']) {
      expect(sql).toContain(`"user"."${column}" ILIKE $1`);
    }
    expect(parameters).toEqual(['%Alice%']);
  });

  it('searches active members, including accounts without a user_information row', async () => {
    const builder = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    const repository = new UsersRepository({ createQueryBuilder: () => builder } as never);

    await repository.search(' Alice ', 20);

    expect(builder.leftJoin).toHaveBeenCalledWith('user_information', 'information', 'information."userId" = user.id');
    expect(builder.where).toHaveBeenCalledWith('information."leaveDate" IS NULL');
    expect(builder.andWhere).toHaveBeenCalledWith(expect.stringContaining('ILIKE :term'), { term: '%Alice%' });
    expect(builder.take).toHaveBeenCalledWith(20);
  });
});
