import { UsersRepository } from './users.repository';

describe('UsersRepository.search', () => {
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
