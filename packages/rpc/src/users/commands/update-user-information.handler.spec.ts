import { describe, expect, it, jest } from '@jest/globals';

import { UserInformationEntity } from '../entities/user-information.entity';
import { UserInformationUpdatedEvent } from '../events/user-information-updated.event';
import { UpdateUserInformationCommand } from './update-user-information.command';
import { UpdateUserInformationHandler } from './update-user-information.handler';

const ownerId = '5e3fb53f-6bb6-456d-9100-8513c76d1fdd';
const adminId = '6a0d03df-8c89-4309-b4ce-d1344f801b06';
const otherId = '39f15067-101b-48d8-b6dd-d5b124cee928';

describe('UpdateUserInformationHandler', () => {
  it('lets the owner update information through an attributed event', async () => {
    const projected = createInformation();
    const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
    const handler = createHandler({ appendAndPublish, projected });

    await expect(
      handler.execute(
        new UpdateUserInformationCommand(ownerId, 'user', ownerId, {
          city: 'Utrecht',
          bankAccountNumber: 'NL00TEST0123456789',
        }),
      ),
    ).resolves.toMatchObject({
      userId: ownerId,
      bankAccountNumber: 'NL00TEST0123456789',
    });

    expect(appendAndPublish).toHaveBeenCalledWith(
      expect.any(UserInformationUpdatedEvent),
    );
    const [event] = (
      appendAndPublish as jest.MockedFunction<typeof appendAndPublish>
    ).mock.calls[0] as [UserInformationUpdatedEvent];
    expect(event.toRecord()).toMatchObject({
      aggregateType: 'user_information',
      eventType: 'user.information_updated',
      eventVersion: 1,
      payload: {
        userId: ownerId,
        changes: {
          city: 'Utrecht',
          bankAccountNumber: 'NL00TEST0123456789',
        },
      },
      metadata: { source: 'user', actorUserId: ownerId },
    });
  });

  it('lets an admin update another user', async () => {
    const handler = createHandler();

    await expect(
      handler.execute(
        new UpdateUserInformationCommand(adminId, 'admin', ownerId, {
          bondNumber: 'ABC123',
        }),
      ),
    ).resolves.toMatchObject({ userId: ownerId });
  });

  it('rejects a non-admin update for another user before reading data', async () => {
    const usersRepository = { findById: jest.fn() };
    const handler = createHandler({ usersRepository });

    await expect(
      handler.execute(
        new UpdateUserInformationCommand(otherId, 'user', ownerId, {
          city: 'Rotterdam',
        }),
      ),
    ).rejects.toThrow('Only the owner or an admin');
    expect(usersRepository.findById).not.toHaveBeenCalled();
  });

  it('rejects an unknown target user', async () => {
    const handler = createHandler({
      usersRepository: { findById: jest.fn().mockResolvedValue(null) },
    });

    await expect(
      handler.execute(
        new UpdateUserInformationCommand(adminId, 'admin', ownerId, {
          city: 'Utrecht',
        }),
      ),
    ).rejects.toThrow('User not found.');
  });

  it('rejects a leave date before the immutable user creation date', async () => {
    const handler = createHandler({
      usersRepository: {
        findById: jest.fn().mockResolvedValue({
          id: ownerId,
          createdAt: new Date('2020-01-01T00:00:00.000Z'),
        }),
      },
    });

    await expect(
      handler.execute(
        new UpdateUserInformationCommand(ownerId, 'user', ownerId, {
          leaveDate: '2019-12-31',
        }),
      ),
    ).rejects.toThrow('leaveDate cannot be before the user creation date.');
  });
});

function createHandler(
  overrides: {
    appendAndPublish?: jest.Mock;
    projected?: UserInformationEntity;
    usersRepository?: { findById: jest.Mock };
  } = {},
) {
  const projected = overrides.projected ?? createInformation();
  const appendAndPublish =
    overrides.appendAndPublish ?? jest.fn().mockResolvedValue({ dispatched: true });

  return new UpdateUserInformationHandler(
    { appendAndPublish } as never,
    { findByUserId: jest.fn().mockResolvedValue(projected) } as never,
    (overrides.usersRepository ?? {
      findById: jest.fn().mockResolvedValue({
        id: ownerId,
        createdAt: new Date('2020-01-01T00:00:00.000Z'),
      }),
    }) as never,
  );
}

function createInformation(): UserInformationEntity {
  return Object.assign(new UserInformationEntity(), {
    userId: ownerId,
    streetName: null,
    houseNumber: null,
    postcode: null,
    city: 'Utrecht',
    phoneNumber: null,
    bankAccountNumber: 'NL00TEST0123456789',
    birthDate: null,
    bondNumber: null,
    leaveDate: null,
    backNumber: null,
    refereeLicense: null,
    createdAt: new Date('2026-07-22T00:00:00.000Z'),
    updatedAt: new Date('2026-07-22T00:00:00.000Z'),
  });
}
