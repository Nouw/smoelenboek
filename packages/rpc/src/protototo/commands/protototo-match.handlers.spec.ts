import { describe, expect, it, jest } from '@jest/globals';

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
    const repository = {
      findRound: jest.fn().mockResolvedValue({ id: roundId }),
      findMatchByNevobo: jest.fn().mockResolvedValue(existing),
    };
    const events = {
      appendAndProject: jest.fn().mockResolvedValue(existing),
    };
    const handler = new AddProtototoMatchHandler(
      events as never,
      {} as never,
      repository as never,
      {
        getMatchSnapshot: jest.fn().mockResolvedValue(snapshot()),
      } as never,
    );
    await handler.execute(
      new AddProtototoMatchCommand(
        actorId,
        roundId,
        selectedTeamIri,
        nevoboMatchId,
      ),
    );
    expect(events.appendAndProject).toHaveBeenCalledWith(
      expect.objectContaining({
        aggregateId: matchId,
        payload: expect.objectContaining({ matchId, removedAt: null }),
      }),
      expect.any(Function),
    );
  });

  it('soft-removes an active match and makes repeated removal idempotent', async () => {
    const active = storedMatch({ removedAt: null });
    const events = {
      appendAndProject: jest.fn().mockResolvedValue({
        ...active,
        removedAt: new Date(),
      }),
    };
    const repository = { findMatch: jest.fn().mockResolvedValue(active) };
    const handler = new RemoveProtototoMatchHandler(
      events as never,
      {} as never,
      repository as never,
    );
    await handler.execute(new RemoveProtototoMatchCommand(actorId, matchId));
    expect(events.appendAndProject).toHaveBeenCalledTimes(1);

    repository.findMatch.mockResolvedValue(
      storedMatch({ removedAt: new Date() }),
    );
    await handler.execute(new RemoveProtototoMatchCommand(actorId, matchId));
    expect(events.appendAndProject).toHaveBeenCalledTimes(1);
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
