import { describe, expect, it, jest } from '@jest/globals';

import {
  ProtototoMatchRemovedEvent,
  ProtototoMatchSavedEvent,
} from '../events/protototo.events';
import {
  AddProtototoMatchHandler,
  RemoveProtototoMatchHandler,
} from './protototo-match.handlers';
import {
  AddProtototoMatchCommand,
  RemoveProtototoMatchCommand,
} from './protototo.commands';

const roundId = '11111111-1111-4111-8111-111111111111';
const matchId = '22222222-2222-4222-8222-222222222222';
const nevoboMatchId = '33333333-3333-4333-8333-333333333333';
const actorId = '44444444-4444-4444-8444-444444444444';
const selectedTeamIri = '/competitie/teams/ckl9y0t/dames/1';

describe('Protototo match handlers', () => {
  it('revives a removed match under its existing identity', async () => {
    const existing = storedMatch({ removedAt: new Date() });
    const revived = storedMatch({ removedAt: null });
    const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
    const repository = {
      findRound: jest.fn().mockResolvedValue({ id: roundId }),
      findMatchByNevobo: jest.fn().mockResolvedValue(existing),
      findMatch: jest.fn().mockResolvedValue(revived),
    };
    const handler = new AddProtototoMatchHandler(
      { appendAndPublish } as never,
      repository as never,
      { getMatchSnapshot: jest.fn().mockResolvedValue(snapshot()) } as never,
    );

    const result = await handler.execute(
      new AddProtototoMatchCommand(actorId, roundId, selectedTeamIri, nevoboMatchId),
    );

    expect(appendAndPublish).toHaveBeenCalledWith(expect.any(ProtototoMatchSavedEvent));
    const [event] = (
      appendAndPublish as jest.MockedFunction<typeof appendAndPublish>
    ).mock.calls[0] as [ProtototoMatchSavedEvent];
    expect(event.toRecord()).toMatchObject({
      payload: expect.objectContaining({ matchId, removedAt: null }),
    });
    expect(result).toBe(revived);
  });

  it('soft-removes an active match and makes repeated removal idempotent', async () => {
    const active = storedMatch({ removedAt: null });
    const removed = storedMatch({ removedAt: new Date() });
    const appendAndPublish = jest.fn().mockResolvedValue({ dispatched: true });
    const repository = {
      findMatch: jest.fn()
        .mockResolvedValueOnce(active)   // first execute: pre-check
        .mockResolvedValueOnce(removed)  // first execute: re-read after dispatch
        .mockResolvedValueOnce(removed), // second execute: pre-check → already removed
    };
    const handler = new RemoveProtototoMatchHandler(
      { appendAndPublish } as never,
      repository as never,
    );

    await handler.execute(new RemoveProtototoMatchCommand(actorId, matchId));
    expect(appendAndPublish).toHaveBeenCalledTimes(1);
    expect(appendAndPublish).toHaveBeenCalledWith(expect.any(ProtototoMatchRemovedEvent));

    await handler.execute(new RemoveProtototoMatchCommand(actorId, matchId));
    expect(appendAndPublish).toHaveBeenCalledTimes(1);
  });
});

function snapshot() {
  return {
    nevoboMatchId,
    selectedTeamIri,
    homeTeamIri: selectedTeamIri,
    homeTeamName: 'USV Protos DS 1',
    awayTeamIri: '/competitie/teams/other/dames/1',
    awayTeamName: 'Opponent DS 1',
    subjectSide: 'home' as const,
    format: 'best_of_5' as const,
    pointMethodIri: '/competitie/puntentelmethodes/best-of-five',
    startsAt: new Date('2026-10-10T16:00:00.000Z'),
  };
}

function storedMatch(overrides: Record<string, unknown>) {
  return {
    id: matchId,
    roundId,
    ...snapshot(),
    ...overrides,
  };
}
