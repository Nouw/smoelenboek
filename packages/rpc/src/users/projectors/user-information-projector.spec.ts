import { describe, expect, it, jest } from '@jest/globals';

import { UserInformationEntity } from '../entities/user-information.entity';
import { UserInformationProjector } from './user-information-projector';

describe('UserInformationProjector', () => {
  it('creates a complete nullable projection on the first update', async () => {
    const entity = new UserInformationEntity();
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(entity),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = new UserInformationProjector();

    await projector.projectUpdated(
      {
        userId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
        changes: { city: 'Utrecht', backNumber: 8 },
      },
      { getRepository: jest.fn().mockReturnValue(repository) } as never,
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
        bankAccountNumber: null,
        refereeLicense: null,
      }),
    );
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Utrecht', backNumber: 8 }),
    );
  });

  it('patches supplied fields and preserves omitted fields', async () => {
    const entity = Object.assign(new UserInformationEntity(), {
      userId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      city: 'Utrecht',
      phoneNumber: '0612345678',
      refereeLicense: 'VS2',
    });
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(entity),
      create: jest.fn(),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = new UserInformationProjector();

    await projector.projectUpdated(
      {
        userId: entity.userId,
        changes: { phoneNumber: null, refereeLicense: 'VS4' },
      },
      { getRepository: jest.fn().mockReturnValue(repository) } as never,
    );

    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        city: 'Utrecht',
        phoneNumber: null,
        refereeLicense: 'VS4',
      }),
    );
  });

  it('ignores join dates from historical events', async () => {
    const entity = Object.assign(new UserInformationEntity(), {
      userId: '5e3fb53f-6bb6-456d-9100-8513c76d1fdd',
      city: 'Utrecht',
    });
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(entity),
      create: jest.fn(),
      save: jest.fn().mockResolvedValue(entity),
    };

    await new UserInformationProjector().projectUpdated(
      {
        userId: entity.userId,
        changes: { city: 'Rotterdam', joinDate: '2019-09-06' },
      } as never,
      { getRepository: jest.fn().mockReturnValue(repository) } as never,
    );

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Rotterdam' }),
    );
    expect(entity).not.toHaveProperty('joinDate');
  });
});
