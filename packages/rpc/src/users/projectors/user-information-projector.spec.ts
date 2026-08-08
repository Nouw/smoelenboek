import { describe, expect, it, jest } from '@jest/globals';

import { UserInformationEntity } from '../entities/user-information.entity';
import { UserInformationUpdatedEvent } from '../events/user-information-updated.event';
import { UserInformationProjector } from './user-information-projector';

const userId = '5e3fb53f-6bb6-456d-9100-8513c76d1fdd';

function makeProjector(manager: object) {
  return new UserInformationProjector({ manager } as never);
}

describe('UserInformationProjector', () => {
  it('creates a complete nullable projection on the first update', async () => {
    const entity = new UserInformationEntity();
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(entity),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = makeProjector({ getRepository: jest.fn().mockReturnValue(repository) });

    await projector.projectUpdated(
      { userId, changes: { city: 'Utrecht', backNumber: 8 } },
      { getRepository: jest.fn().mockReturnValue(repository) } as never,
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId, bankAccountNumber: null, refereeLicense: null }),
    );
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Utrecht', backNumber: 8 }),
    );
  });

  it('patches supplied fields and preserves omitted fields', async () => {
    const entity = Object.assign(new UserInformationEntity(), {
      userId,
      city: 'Utrecht',
      phoneNumber: '0612345678',
      refereeLicense: 'VS2',
    });
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(entity),
      create: jest.fn(),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = makeProjector({ getRepository: jest.fn().mockReturnValue(repository) });

    await projector.projectUpdated(
      { userId, changes: { phoneNumber: null, refereeLicense: 'VS4' } },
      { getRepository: jest.fn().mockReturnValue(repository) } as never,
    );

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Utrecht', phoneNumber: null, refereeLicense: 'VS4' }),
    );
  });

  it('ignores join dates from historical events', async () => {
    const entity = Object.assign(new UserInformationEntity(), { userId, city: 'Utrecht' });
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(entity),
      create: jest.fn(),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = makeProjector({ getRepository: jest.fn().mockReturnValue(repository) });

    await projector.projectUpdated(
      { userId, changes: { city: 'Rotterdam', joinDate: '2019-09-06' } } as never,
      { getRepository: jest.fn().mockReturnValue(repository) } as never,
    );

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Rotterdam' }),
    );
    expect(entity).not.toHaveProperty('joinDate');
  });

  describe('handle() — EventsHandler routing', () => {
    it('routes UserInformationUpdatedEvent to projectUpdated', async () => {
      const entity = new UserInformationEntity();
      const repository = {
        findOneBy: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue(entity),
        save: jest.fn().mockResolvedValue(entity),
      };
      const manager = { getRepository: jest.fn().mockReturnValue(repository) };
      const projector = makeProjector(manager);

      await projector.handle(
        new UserInformationUpdatedEvent(
          { userId, changes: { city: 'Amsterdam' } },
          { source: 'user', actorUserId: userId },
        ),
      );

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ city: 'Amsterdam' }),
      );
    });

    it('projectUpdated is idempotent on replay', async () => {
      const entity = Object.assign(new UserInformationEntity(), { userId, city: 'Utrecht' });
      const repository = {
        findOneBy: jest.fn().mockResolvedValue(entity),
        create: jest.fn(),
        save: jest.fn().mockResolvedValue(entity),
      };
      const manager = { getRepository: jest.fn().mockReturnValue(repository) };
      const projector = makeProjector(manager);
      const event = new UserInformationUpdatedEvent(
        { userId, changes: { city: 'Utrecht' } },
        { source: 'user', actorUserId: userId },
      );

      await projector.handle(event);
      await projector.handle(event);

      expect(repository.save).toHaveBeenCalledTimes(2);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });
});
