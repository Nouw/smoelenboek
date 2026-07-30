import { ProtototoRepository } from './protototo.repository';

describe('ProtototoRepository', () => {
  it('lists rounds by creation date with the newest first', async () => {
    const find = jest.fn().mockResolvedValue([]);
    const repository = new ProtototoRepository(
      { find } as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await repository.listRounds(true);

    expect(find).toHaveBeenCalledWith({
      where: {},
      relations: { matches: true },
      order: { createdAt: 'DESC', matches: { startsAt: 'ASC' } },
    });
  });
});
