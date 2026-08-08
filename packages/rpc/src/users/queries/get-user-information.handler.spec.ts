import { describe, expect, it, jest } from '@jest/globals';

import { UserInformationEntity } from '../entities/user-information.entity';
import { GetUserInformationHandler } from './get-user-information.handler';
import { GetUserInformationQuery } from './get-user-information.query';

const targetUserId = '5e3fb53f-6bb6-456d-9100-8513c76d1fdd';

describe('GetUserInformationHandler', () => {
  it('returns null when the user has no information projection', async () => {
    const handler = new GetUserInformationHandler({
      findByUserId: jest.fn().mockResolvedValue(null),
    } as never);

    await expect(
      handler.execute(
        new GetUserInformationQuery(targetUserId, 'user', targetUserId),
      ),
    ).resolves.toBeNull();
  });

  it('includes bank information for the owner or an admin', async () => {
    const information = createInformation();
    const handler = new GetUserInformationHandler({
      findByUserId: jest.fn().mockResolvedValue(information),
    } as never);

    await expect(
      handler.execute(
        new GetUserInformationQuery(targetUserId, 'user', targetUserId),
      ),
    ).resolves.toMatchObject({ bankAccountNumber: 'NL00TEST0123456789' });
    await expect(
      handler.execute(
        new GetUserInformationQuery(
          '6a0d03df-8c89-4309-b4ce-d1344f801b06',
          'admin',
          targetUserId,
        ),
      ),
    ).resolves.toMatchObject({ bankAccountNumber: 'NL00TEST0123456789' });
  });

  it('omits bank information for another authenticated member', async () => {
    const handler = new GetUserInformationHandler({
      findByUserId: jest.fn().mockResolvedValue(createInformation()),
    } as never);

    const result = await handler.execute(
      new GetUserInformationQuery(
        '6a0d03df-8c89-4309-b4ce-d1344f801b06',
        'user',
        targetUserId,
      ),
    );

    expect(result).toMatchObject({ city: 'Utrecht' });
    expect(result).not.toHaveProperty('bankAccountNumber');
  });
});

function createInformation(): UserInformationEntity {
  return Object.assign(new UserInformationEntity(), {
    userId: targetUserId,
    streetName: 'Example street',
    houseNumber: '49',
    postcode: '1234 AB',
    city: 'Utrecht',
    phoneNumber: '0612345678',
    bankAccountNumber: 'NL00TEST0123456789',
    birthDate: '2002-01-18',
    bondNumber: 'ABC123',
    leaveDate: null,
    backNumber: 8,
    refereeLicense: 'VS2',
    createdAt: new Date('2026-07-22T00:00:00.000Z'),
    updatedAt: new Date('2026-07-22T00:00:00.000Z'),
  });
}
