import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, jest } from '@jest/globals';

import { SeasonEntity } from '../entities/season.entity';
import { SeasonProjector } from './season-projector';

describe('SeasonProjector', () => {
  it('creates a season projection from a snapshot', async () => {
    const entity = new SeasonEntity();
    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(entity),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = new SeasonProjector();

    await expect(
      projector.projectSnapshot(
        {
          seasonId: '9ab57931-7d74-4caf-826d-38c45f3303ff',
          name: '2026/2027',
          startsAt: '2026-08-01T00:00:00.000Z',
          endsAt: '2027-07-31T23:59:59.999Z',
        },
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).resolves.toBe(entity);

    expect(repository.create).toHaveBeenCalledWith({
      id: '9ab57931-7d74-4caf-826d-38c45f3303ff',
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '2026/2027',
        startsAt: new Date('2026-08-01T00:00:00.000Z'),
        endsAt: new Date('2027-07-31T23:59:59.999Z'),
      }),
    );
  });

  it('rejects overlapping seasons', async () => {
    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(new SeasonEntity()),
      }),
    };
    const projector = new SeasonProjector();

    await expect(
      projector.projectSnapshot(
        {
          seasonId: '9ab57931-7d74-4caf-826d-38c45f3303ff',
          name: '2026/2027',
          startsAt: '2026-08-01T00:00:00.000Z',
          endsAt: '2027-07-31T23:59:59.999Z',
        },
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

