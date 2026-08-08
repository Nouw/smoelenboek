import { describe, expect, it, jest } from '@jest/globals';

import { UserInformationUpdatedEvent } from '../events/user-information-updated.event';
import { UserInformationUpdatedHandler } from './user-information-updated.handler';

const userId = 'a1b2c3d4-0000-0000-0000-000000000001';

const stubUser = { id: userId, firstName: 'Jan', lastName: 'Smit', preferredLocale: 'nl', email: 'jan@example.com' };
const stubInfo = { userId, streetName: 'Oudegracht', houseNumber: '10', postcode: '3511AA', city: 'Utrecht', bankAccountNumber: null };

function makeHandler(overrides: { user?: object | null; info?: object | null } = {}) {
  const enqueue = jest.fn().mockResolvedValue({});
  const handler = new UserInformationUpdatedHandler(
    { enqueue } as never,
    { findById: jest.fn().mockResolvedValue(overrides.user === undefined ? stubUser : overrides.user) } as never,
    { findByUserId: jest.fn().mockResolvedValue(overrides.info === undefined ? stubInfo : overrides.info) } as never,
  );
  return { handler, enqueue };
}

function event(changes: Record<string, unknown>): UserInformationUpdatedEvent {
  return new UserInformationUpdatedEvent({ userId, changes: changes as never }, { source: 'user', actorUserId: userId });
}

describe('UserInformationUpdatedHandler', () => {
  it('queues address_update for secretaris and penningmeester when a street address field changes', async () => {
    const { handler, enqueue } = makeHandler();

    await handler.handle(event({ city: 'Amsterdam' }));

    expect(enqueue).toHaveBeenCalledTimes(2);
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ messageType: 'address_update', recipient: 'secretaris@usvprotos.nl' }),
    );
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ messageType: 'address_update', recipient: 'penningmeester@usvprotos.nl' }),
    );
  });

  it('merges changed address fields with existing stored values', async () => {
    const { handler, enqueue } = makeHandler();

    await handler.handle(event({ city: 'Rotterdam' }));

    const [firstCall] = (enqueue as jest.MockedFunction<typeof enqueue>).mock.calls[0] as [{ newAddress: string }];
    expect(firstCall.newAddress).toContain('Rotterdam');
    expect(firstCall.newAddress).toContain('Oudegracht');
    expect(firstCall.newAddress).toContain('10');
    expect(firstCall.newAddress).toContain('3511AA');
  });

  it('queues bankaccount_update for penningmeester when bank account changes', async () => {
    const { handler, enqueue } = makeHandler();

    await handler.handle(event({ bankAccountNumber: 'NL00TEST0123456789' }));

    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: 'bankaccount_update',
        recipient: 'penningmeester@usvprotos.nl',
        newBankaccount: 'NL00TEST0123456789',
      }),
    );
  });

  it('queues both address and bank account emails when both change', async () => {
    const { handler, enqueue } = makeHandler();

    await handler.handle(event({ streetName: 'Weerdsingel', bankAccountNumber: 'NL00TEST9999999999' }));

    expect(enqueue).toHaveBeenCalledTimes(3);
    const types = (enqueue as jest.MockedFunction<typeof enqueue>).mock.calls.map(
      ([input]) => (input as { messageType: string }).messageType,
    );
    expect(types.filter((t) => t === 'address_update')).toHaveLength(2);
    expect(types.filter((t) => t === 'bankaccount_update')).toHaveLength(1);
  });

  it('sends nothing when the change contains no address or bank account fields', async () => {
    const { handler, enqueue } = makeHandler();

    await handler.handle(event({ phoneNumber: '0612345678' }));

    expect(enqueue).not.toHaveBeenCalled();
  });

  it('skips sending when the user record is not found', async () => {
    const { handler, enqueue } = makeHandler({ user: null });

    await handler.handle(event({ city: 'Amsterdam' }));

    expect(enqueue).not.toHaveBeenCalled();
  });

  it('skips sending when user information is not found', async () => {
    const { handler, enqueue } = makeHandler({ info: null });

    await handler.handle(event({ city: 'Amsterdam' }));

    expect(enqueue).not.toHaveBeenCalled();
  });

  it('does not queue bankaccount_update when bankAccountNumber is explicitly set to null', async () => {
    const { handler, enqueue } = makeHandler();

    await handler.handle(event({ bankAccountNumber: null }));

    expect(enqueue).not.toHaveBeenCalled();
  });
});
