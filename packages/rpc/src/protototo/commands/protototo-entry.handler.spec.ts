import { describe, expect, it, jest } from '@jest/globals';

import { SubmitProtototoEntryHandler } from './protototo-entry.handler';
import { SubmitProtototoEntryCommand } from './protototo.commands';

const roundId = '11111111-1111-4111-8111-111111111111';
const matchOne = '22222222-2222-4222-8222-222222222222';
const matchTwo = '33333333-3333-4333-8333-333333333333';
const userId = '44444444-4444-4444-8444-444444444444';
const now = new Date('2026-10-01T12:00:00.000Z');

describe('SubmitProtototoEntryHandler', () => {
  it('requires an anonymous Tikkie claim but never requires one from members', async () => {
    const anonymous = harness({ tikkieUrl: 'https://tikkie.me/pay/example' });
    await expect(
      anonymous.handler.execute(
        command(null, [{ matchId: matchOne, setWinners: [true, true, true] }], {
          firstName: 'Ada',
          email: 'ada@example.com',
          paymentClaimed: false,
        }),
      ),
    ).rejects.toThrow('Payment confirmation is required');

    const member = harness({ tikkieUrl: 'https://tikkie.me/pay/example' });
    await expect(
      member.handler.execute(
        command(userId, [
          { matchId: matchOne, setWinners: [true, true, true] },
        ]),
      ),
    ).resolves.toBeDefined();
    const memberEvent = member.preparedEvents[0];
    expect(memberEvent).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({
          participantType: 'member',
          email: null,
          paymentClaimedAt: null,
        }),
      }),
    );
  });

  it('normalizes and replaces the same anonymous identity atomically', async () => {
    const existing = {
      id: '55555555-5555-4555-8555-555555555555',
      firstNameNormalized: 'ada',
      paymentClaimedAt: now,
    };
    const state = harness({ anonymousEntry: existing });
    await state.handler.execute(
      command(
        null,
        [{ matchId: matchOne, setWinners: [false, false, false] }],
        {
          firstName: '  Ada  ',
          email: ' ADA@Example.COM ',
          paymentClaimed: true,
        },
      ),
    );

    expect(state.repository.findRoundForUpdate).toHaveBeenCalledWith(
      roundId,
      expect.anything(),
    );
    expect(state.repository.findAnonymousEntry).toHaveBeenCalledWith(
      roundId,
      'ada@example.com',
      expect.anything(),
    );
    expect(state.preparedEvents[0]).toEqual(
      expect.objectContaining({
        aggregateId: existing.id,
        payload: expect.objectContaining({
          entryId: existing.id,
          firstName: 'Ada',
          email: 'ada@example.com',
          firstNameNormalized: 'ada',
        }),
      }),
    );
  });

  it('rejects stale lineups and accepts the exact late-added lineup', async () => {
    const state = harness({
      matches: [
        { id: matchOne, format: 'best_of_5' },
        { id: matchTwo, format: 'four_sets' },
      ],
    });
    await expect(
      state.handler.execute(
        command(null, [{ matchId: matchOne, setWinners: [true, true, true] }], {
          firstName: 'Ada',
          email: 'ada@example.com',
        }),
      ),
    ).rejects.toThrow('every active match exactly once');
    await expect(
      state.handler.execute(
        command(
          null,
          [
            { matchId: matchOne, setWinners: [true, true, true] },
            {
              matchId: matchTwo,
              setWinners: [true, false, true, false],
            },
          ],
          { firstName: 'Ada', email: 'ada@example.com' },
        ),
      ),
    ).resolves.toBeDefined();
  });

  it('blocks a closed round and allows edits immediately after an admin reopens it', async () => {
    const state = harness({ closesAt: new Date('2026-10-01T11:00:00.000Z') });
    const input = command(
      null,
      [{ matchId: matchOne, setWinners: [true, true, true] }],
      { firstName: 'Ada', email: 'ada@example.com' },
    );
    await expect(state.handler.execute(input)).rejects.toThrow(
      'Betting is not open',
    );
    state.repository.findRoundForUpdate.mockResolvedValue({
      ...state.round,
      closesAt: new Date('2026-10-02T11:00:00.000Z'),
    });
    await expect(state.handler.execute(input)).resolves.toBeDefined();
  });
});

function command(
  actorUserId: string | null,
  predictions: Array<{ matchId: string; setWinners: boolean[] }>,
  anonymous: {
    firstName?: string;
    email?: string;
    paymentClaimed?: boolean;
  } = {},
) {
  return new SubmitProtototoEntryCommand(
    actorUserId,
    roundId,
    predictions,
    anonymous.firstName,
    anonymous.email,
    anonymous.paymentClaimed,
    now,
  );
}

function harness(
  options: {
    tikkieUrl?: string | null;
    closesAt?: Date;
    matches?: Array<{
      id: string;
      format: 'best_of_5' | 'four_sets' | 'four_plus_one';
    }>;
    anonymousEntry?: unknown;
  } = {},
) {
  const round = {
    id: roundId,
    publishedAt: new Date('2026-09-01T00:00:00.000Z'),
    archivedAt: null,
    opensAt: new Date('2026-09-01T00:00:00.000Z'),
    closesAt: options.closesAt ?? new Date('2026-10-02T00:00:00.000Z'),
    tikkieUrl: options.tikkieUrl ?? null,
  };
  const repository = {
    findRoundForUpdate: jest.fn().mockResolvedValue(round),
    findActiveMatches: jest
      .fn()
      .mockResolvedValue(
        options.matches ?? [{ id: matchOne, format: 'best_of_5' }],
      ),
    findMemberEntry: jest.fn().mockResolvedValue(null),
    findAnonymousEntry: jest
      .fn()
      .mockResolvedValue(options.anonymousEntry ?? null),
  };
  const preparedEvents: unknown[] = [];
  const events = {
    appendPreparedAndProject: jest.fn(
      async (prepare: (manager: unknown) => Promise<unknown>) => {
        const event = await prepare({});
        preparedEvents.push(event);
        return { id: 'entry' };
      },
    ),
  };
  return {
    round,
    repository,
    events,
    preparedEvents,
    handler: new SubmitProtototoEntryHandler(
      events as never,
      {} as never,
      repository as never,
      {
        findById: jest.fn().mockResolvedValue({
          id: userId,
          firstName: 'Member',
          lastName: 'One',
          name: 'Member One',
        }),
      } as never,
    ),
  };
}
