import { describe, expect, it, jest } from '@jest/globals';

import {
  deriveMatchFormat,
  NevoboClient,
  NevoboUpstreamError,
} from './nevobo.client';

const matchId = '11111111-1111-4111-8111-111111111111';
const homeTeam = '/competitie/teams/ckl9y0t/dames/1';
const awayTeam = '/competitie/teams/ckl9y0t/dames/2';
const homeEntry = '/competitie/pouleindelingen/competition/pool/a';
const awayEntry = '/competitie/pouleindelingen/competition/pool/b';
const poolIri = '/competitie/poules/competition/pool';
const methodIri = '/competitie/puntentelmethodes/method';

describe('NevoboClient', () => {
  it('validates the team collection and exposes stable IRIs', async () => {
    const client = createClient({
      '/competitie/teams?vereniging=%2Frelatiebeheer%2Fverenigingen%2Fckl9y0t':
        {
          '@type': 'hydra:Collection',
          'hydra:member': [
            {
              '@id': homeTeam,
              uuid: '22222222-2222-4222-8222-222222222222',
              naam: 'USV Protos DS 1',
            },
          ],
        },
    });

    await expect(client.listTeams()).resolves.toEqual([
      { id: homeTeam, name: 'USV Protos DS 1' },
    ]);
  });

  it.each([
    [
      'best_of_5',
      [
        { setsA: 3, setsB: 0 },
        { setsA: 3, setsB: 1 },
        { setsA: 3, setsB: 2 },
      ],
    ],
    [
      'four_sets',
      [
        { setsA: 4, setsB: 0 },
        { setsA: 3, setsB: 1 },
        { setsA: 2, setsB: 2 },
      ],
    ],
    [
      'four_plus_one',
      [
        { setsA: 4, setsB: 0 },
        { setsA: 3, setsB: 1 },
        { setsA: 3, setsB: 2 },
      ],
    ],
  ] as const)('derives the %s pool format', (expected, outcomes) => {
    expect(deriveMatchFormat(outcomes)).toBe(expected);
  });

  it('browses matches for the selected team and resolves both team names', async () => {
    const client = createClient({
      '/competitie/wedstrijden?order%5Bbegintijd%5D=asc&team=%2Fcompetitie%2Fteams%2Fckl9y0t%2Fdames%2F1':
        {
          '@type': 'hydra:Collection',
          'hydra:member': [matchDetail()],
        },
      [homeEntry]: {
        '@id': homeEntry,
        team: homeTeam,
        omschrijving: 'USV Protos DS 1',
      },
      [awayEntry]: {
        '@id': awayEntry,
        team: awayTeam,
        omschrijving: 'USV Protos DS 2',
      },
    });

    await expect(client.listMatches(homeTeam)).resolves.toEqual([
      {
        id: matchId,
        homeTeamName: 'USV Protos DS 1',
        awayTeamName: 'USV Protos DS 2',
        startsAt: '2026-10-10T15:00:00.000Z',
      },
    ]);
  });

  it('resolves the selected home side, team names, and point method', async () => {
    const client = createClient(
      matchRoutes([
        { setsA: 4, setsB: 0 },
        { setsA: 3, setsB: 1 },
        { setsA: 2, setsB: 2 },
      ]),
    );

    await expect(client.getMatchSnapshot(homeTeam, matchId)).resolves.toEqual({
      nevoboMatchId: matchId,
      selectedTeamIri: homeTeam,
      homeTeamIri: homeTeam,
      homeTeamName: 'USV Protos DS 1',
      awayTeamIri: awayTeam,
      awayTeamName: 'USV Protos DS 2',
      subjectSide: 'home',
      format: 'four_sets',
      pointMethodIri: methodIri,
      startsAt: new Date('2026-10-10T17:00:00+02:00'),
    });
  });

  it('resolves both team names, the selected away side, and the point method', async () => {
    const client = createClient(
      matchRoutes([
        { setsA: 4, setsB: 0 },
        { setsA: 3, setsB: 1 },
        { setsA: 3, setsB: 2 },
      ]),
    );

    await expect(client.getMatchSnapshot(awayTeam, matchId)).resolves.toEqual({
      nevoboMatchId: matchId,
      selectedTeamIri: awayTeam,
      homeTeamIri: homeTeam,
      homeTeamName: 'USV Protos DS 1',
      awayTeamIri: awayTeam,
      awayTeamName: 'USV Protos DS 2',
      subjectSide: 'away',
      format: 'four_plus_one',
      pointMethodIri: methodIri,
      startsAt: new Date('2026-10-10T17:00:00+02:00'),
    });
  });

  it('converts final set scores relative to the selected side', async () => {
    const detail = matchDetail({
      status: { waarde: 'definitief' },
      setstanden: [
        { set: 1, puntenA: 25, puntenB: 20 },
        { set: 2, puntenA: 21, puntenB: 25 },
        { set: 3, puntenA: 25, puntenB: 22 },
      ],
    });
    const home = createClient({
      [`/competitie/wedstrijden/${matchId}`]: detail,
    });
    const away = createClient({
      [`/competitie/wedstrijden/${matchId}`]: detail,
    });

    await expect(home.getResult(matchId, 'home')).resolves.toEqual({
      status: 'final',
      setWinners: [true, false, true],
    });
    await expect(away.getResult(matchId, 'away')).resolves.toEqual({
      status: 'final',
      setWinners: [false, true, false],
    });
  });

  it.each([
    ['concept', 'pending'],
    ['afgelast', 'cancelled'],
  ] as const)('maps %s results to %s', async (upstreamStatus, expected) => {
    const client = createClient({
      [`/competitie/wedstrijden/${matchId}`]: matchDetail({
        status: { waarde: upstreamStatus },
      }),
    });
    await expect(client.getResult(matchId, 'home')).resolves.toEqual({
      status: expected,
      setWinners: null,
    });
  });

  it('rejects unsupported formats and malformed final results', async () => {
    expect(() => deriveMatchFormat([{ setsA: 2, setsB: 0 }])).toThrow(
      NevoboUpstreamError,
    );
    expect(() =>
      deriveMatchFormat([
        { setsA: 2, setsB: 1 },
        { setsA: 2, setsB: 2 },
        { setsA: 2, setsB: 3 },
      ]),
    ).toThrow(NevoboUpstreamError);
    const client = createClient({
      [`/competitie/wedstrijden/${matchId}`]: matchDetail({
        status: { waarde: 'definitief' },
        setstanden: [{ set: 1, puntenA: 25, puntenB: 25 }],
      }),
    });
    await expect(client.getResult(matchId, 'home')).rejects.toThrow(
      'malformed final result',
    );
  });

  it('rejects a result returned for a different match identity', async () => {
    const client = createClient({
      [`/competitie/wedstrijden/${matchId}`]: matchDetail({
        uuid: '99999999-9999-4999-8999-999999999999',
      }),
    });

    await expect(client.getResult(matchId, 'home')).rejects.toThrow(
      'different match identity',
    );
  });

  it('wraps upstream failures without leaking response bodies', async () => {
    const client = createClient(
      {},
      async () => new Response('private upstream details', { status: 503 }),
    );
    await expect(client.listTeams()).rejects.toThrow(
      'Nevobo request failed with status 503.',
    );
  });

  it('aborts requests after the configured timeout', async () => {
    const fetcher = jest.fn(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    const client = createClient({}, fetcher, 1);
    await expect(client.listTeams()).rejects.toThrow('timed out');
  });

  it('rejects malformed JSON-LD and off-association team inputs', async () => {
    const client = createClient({
      '/competitie/teams?vereniging=%2Frelatiebeheer%2Fverenigingen%2Fckl9y0t':
        {
          '@type': 'not-a-collection',
        },
    });
    await expect(client.listTeams()).rejects.toThrow('malformed JSON-LD');
    await expect(
      client.listMatches('/competitie/teams/not-protos/dames/1'),
    ).rejects.toThrow('not a configured Protos team');
  });
});

function createClient(
  routes: Record<string, unknown>,
  fetcher: (
    input: string | URL | Request,
    init?: RequestInit,
  ) => Promise<Response> = async (input) => {
    const url = new URL(input.toString());
    const key = `${url.pathname}${url.search}`;
    const value = routes[key];
    return value === undefined
      ? new Response(null, { status: 404 })
      : Response.json(value);
  },
  timeoutMs = 50,
): NevoboClient {
  const config = {
    get(key: string) {
      return key === 'NEVOBO_BASE_URL' ? 'https://api.nevobo.test' : 'ckl9y0t';
    },
  };
  return new NevoboClient(config as never, fetcher, timeoutMs);
}

function matchRoutes(
  outcomes: Array<{ setsA: number; setsB: number }>,
): Record<string, unknown> {
  return {
    [`/competitie/wedstrijden/${matchId}`]: matchDetail(),
    [homeEntry]: {
      '@id': homeEntry,
      team: homeTeam,
      omschrijving: 'USV Protos DS 1',
    },
    [awayEntry]: {
      '@id': awayEntry,
      team: awayTeam,
      omschrijving: 'USV Protos DS 2',
    },
    [poolIri]: { '@id': poolIri, puntentelmethode: methodIri },
    [methodIri]: { '@id': methodIri, mogelijkeUitslagen: outcomes },
  };
}

function matchDetail(overrides: Record<string, unknown> = {}) {
  return {
    uuid: matchId,
    poule: poolIri,
    teams: [homeEntry, awayEntry],
    tijdstip: '2026-10-10T17:00:00+02:00',
    status: { waarde: 'concept' },
    ...overrides,
  };
}
