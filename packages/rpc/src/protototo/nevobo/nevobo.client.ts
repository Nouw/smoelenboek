import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MatchFormat, SubjectSide } from '@repo/api';
import { z } from 'zod';

import type { RpcEnv } from '../../config/env';

export const NEVOBO_FETCH = Symbol('NEVOBO_FETCH');
export const NEVOBO_TIMEOUT_MS = Symbol('NEVOBO_TIMEOUT_MS');

type Fetcher = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export type NevoboTeamSummary = {
  id: string;
  name: string;
};

export type NevoboMatchSummary = {
  id: string;
  homeTeamName: string;
  awayTeamName: string;
  startsAt: string;
};

export type NevoboMatchSnapshot = {
  nevoboMatchId: string;
  selectedTeamIri: string;
  homeTeamIri: string;
  homeTeamName: string;
  awayTeamIri: string;
  awayTeamName: string;
  subjectSide: SubjectSide;
  format: MatchFormat;
  pointMethodIri: string;
  startsAt: Date;
};

export type NevoboResult =
  | { status: 'pending'; setWinners: null }
  | { status: 'cancelled'; setWinners: null }
  | { status: 'final'; setWinners: boolean[] };

export class NevoboUpstreamError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'NevoboUpstreamError';
  }
}

const teamSchema = z.object({
  '@id': z.string().min(1),
  uuid: z.string().uuid(),
  naam: z.string().min(1),
});

const teamCollectionSchema = z.object({
  '@type': z.literal('hydra:Collection'),
  'hydra:member': z.array(teamSchema),
});

const matchSchema = z.object({
  uuid: z.string().uuid(),
  poule: z.string().min(1),
  teams: z.tuple([z.string().min(1), z.string().min(1)]),
  tijdstip: z.iso.datetime({ offset: true }),
  status: z
    .object({ waarde: z.string().min(1), omschrijving: z.string().optional() })
    .optional(),
  setstanden: z
    .array(
      z.object({
        set: z.number().int().positive(),
        puntenA: z.number().int().nonnegative(),
        puntenB: z.number().int().nonnegative(),
      }),
    )
    .optional(),
});

const matchCollectionSchema = z.object({
  '@type': z.literal('hydra:Collection'),
  'hydra:member': z.array(matchSchema),
});

const poolEntrySchema = z.object({
  '@id': z.string().min(1),
  team: z.string().min(1),
  omschrijving: z.string().min(1),
});

const poolSchema = z.object({
  '@id': z.string().min(1),
  puntentelmethode: z.string().min(1),
});

const pointMethodSchema = z.object({
  '@id': z.string().min(1),
  mogelijkeUitslagen: z
    .array(
      z.object({
        setsA: z.number().int().nonnegative(),
        setsB: z.number().int().nonnegative(),
      }),
    )
    .min(1),
});

const CANCELLED_STATUSES = new Set([
  'afgelast',
  'cancelled',
  'geannuleerd',
  'vervallen',
]);
const FINAL_STATUSES = new Set([
  'definitief',
  'final',
  'gespeeld',
  'uitgespeeld',
  'vastgesteld',
]);

@Injectable()
export class NevoboClient {
  private readonly baseUrl: URL;
  private readonly associationId: string;

  constructor(
    config: ConfigService<RpcEnv, true>,
    @Inject(NEVOBO_FETCH) private readonly fetcher: Fetcher,
    @Inject(NEVOBO_TIMEOUT_MS) private readonly timeoutMs: number,
  ) {
    const configuredBaseUrl = config.get('NEVOBO_BASE_URL', { infer: true });
    this.baseUrl = new URL(
      configuredBaseUrl.endsWith('/')
        ? configuredBaseUrl
        : `${configuredBaseUrl}/`,
    );
    this.associationId = config.get('NEVOBO_ASSOCIATION_ID', { infer: true });
  }

  async listTeams(): Promise<NevoboTeamSummary[]> {
    const collection = await this.getJson(
      `/competitie/teams?vereniging=${encodeURIComponent(`/relatiebeheer/verenigingen/${this.associationId}`)}`,
      teamCollectionSchema,
    );
    return collection['hydra:member'].map((team) => ({
      id: team['@id'],
      name: team.naam,
    }));
  }

  async listMatches(selectedTeamIri: string): Promise<NevoboMatchSummary[]> {
    this.requireAssociationTeam(selectedTeamIri);
    const query = new URLSearchParams({
      'order[begintijd]': 'asc',
      team: selectedTeamIri,
    });
    const collection = await this.getJson(
      `/competitie/wedstrijden?${query.toString()}`,
      matchCollectionSchema,
    );
    return Promise.all(
      collection['hydra:member'].map(async (match) => {
        const [home, away] = await Promise.all([
          this.getJson(match.teams[0], poolEntrySchema),
          this.getJson(match.teams[1], poolEntrySchema),
        ]);
        this.resolveSubjectSide(selectedTeamIri, home.team, away.team);
        return {
          id: match.uuid,
          homeTeamName: home.omschrijving,
          awayTeamName: away.omschrijving,
          startsAt: new Date(match.tijdstip).toISOString(),
        };
      }),
    );
  }

  async getMatchSnapshot(
    selectedTeamIri: string,
    nevoboMatchId: string,
  ): Promise<NevoboMatchSnapshot> {
    this.requireAssociationTeam(selectedTeamIri);
    const match = await this.getJson(
      `/competitie/wedstrijden/${requireUuid(nevoboMatchId)}`,
      matchSchema,
    );
    if (match.uuid !== nevoboMatchId) {
      throw new NevoboUpstreamError(
        'Nevobo returned a different match identity.',
      );
    }
    const [home, away, pool] = await Promise.all([
      this.getJson(match.teams[0], poolEntrySchema),
      this.getJson(match.teams[1], poolEntrySchema),
      this.getJson(match.poule, poolSchema),
    ]);
    const pointMethod = await this.getJson(
      pool.puntentelmethode,
      pointMethodSchema,
    );
    return {
      nevoboMatchId: match.uuid,
      selectedTeamIri,
      homeTeamIri: home.team,
      homeTeamName: home.omschrijving,
      awayTeamIri: away.team,
      awayTeamName: away.omschrijving,
      subjectSide: this.resolveSubjectSide(
        selectedTeamIri,
        home.team,
        away.team,
      ),
      format: deriveMatchFormat(pointMethod.mogelijkeUitslagen),
      pointMethodIri: pointMethod['@id'],
      startsAt: new Date(match.tijdstip),
    };
  }

  async getResult(
    nevoboMatchId: string,
    subjectSide: SubjectSide,
  ): Promise<NevoboResult> {
    const match = await this.getJson(
      `/competitie/wedstrijden/${requireUuid(nevoboMatchId)}`,
      matchSchema,
    );
    if (match.uuid !== nevoboMatchId) {
      throw new NevoboUpstreamError(
        'Nevobo returned a different match identity.',
      );
    }
    const status = normalizeStatus(match.status?.waarde);
    if (CANCELLED_STATUSES.has(status)) {
      return { status: 'cancelled', setWinners: null };
    }
    if (!FINAL_STATUSES.has(status)) {
      return { status: 'pending', setWinners: null };
    }
    const sets = [...(match.setstanden ?? [])].sort(
      (left, right) => left.set - right.set,
    );
    if (
      sets.length === 0 ||
      sets.some(
        (set, index) => set.set !== index + 1 || set.puntenA === set.puntenB,
      )
    ) {
      throw new NevoboUpstreamError(
        'Nevobo returned a malformed final result.',
      );
    }
    return {
      status: 'final',
      setWinners: sets.map((set) =>
        subjectSide === 'home'
          ? set.puntenA > set.puntenB
          : set.puntenB > set.puntenA,
      ),
    };
  }

  private resolveSubjectSide(
    selectedTeamIri: string,
    homeTeamIri: string,
    awayTeamIri: string,
  ): SubjectSide {
    const selected = this.normalizeIri(selectedTeamIri);
    const homeMatches = this.normalizeIri(homeTeamIri) === selected;
    const awayMatches = this.normalizeIri(awayTeamIri) === selected;
    if (homeMatches === awayMatches) {
      throw new NevoboUpstreamError(
        'The selected Protos team does not resolve to exactly one match side.',
      );
    }
    return homeMatches ? 'home' : 'away';
  }

  private requireAssociationTeam(value: string): void {
    const path = this.normalizeIri(value);
    const prefix = `/competitie/teams/${this.associationId.toLocaleLowerCase('en-US')}/`;
    if (!path.toLocaleLowerCase('en-US').startsWith(prefix)) {
      throw new NevoboUpstreamError(
        'The selected team is not a configured Protos team.',
      );
    }
  }

  private normalizeIri(value: string): string {
    const url = this.resolveUrl(value);
    return decodeURI(url.pathname).replace(/\/$/, '');
  }

  private resolveUrl(value: string): URL {
    let resolved: URL;
    try {
      resolved = new URL(value, this.baseUrl);
    } catch (error) {
      throw new NevoboUpstreamError('Nevobo returned an invalid IRI.', {
        cause: error,
      });
    }
    if (resolved.origin !== this.baseUrl.origin) {
      throw new NevoboUpstreamError('Nevobo returned an off-origin IRI.');
    }
    return resolved;
  }

  private async getJson<TSchema extends z.ZodType>(
    path: string,
    schema: TSchema,
  ): Promise<z.output<TSchema>> {
    const url = this.resolveUrl(path);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(url, {
        headers: { accept: 'application/ld+json, application/json' },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new NevoboUpstreamError(
          `Nevobo request failed with status ${response.status}.`,
        );
      }
      const parsed = schema.safeParse(await response.json());
      if (!parsed.success) {
        throw new NevoboUpstreamError('Nevobo returned malformed JSON-LD.');
      }
      return parsed.data;
    } catch (error) {
      if (error instanceof NevoboUpstreamError) throw error;
      if (controller.signal.aborted) {
        throw new NevoboUpstreamError('Nevobo request timed out.', {
          cause: error,
        });
      }
      throw new NevoboUpstreamError('Nevobo request failed.', { cause: error });
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function deriveMatchFormat(
  outcomes: ReadonlyArray<{ setsA: number; setsB: number }>,
): MatchFormat {
  if (
    outcomes.some(
      ({ setsA, setsB }) =>
        !Number.isInteger(setsA) ||
        !Number.isInteger(setsB) ||
        setsA < 0 ||
        setsB < 0,
    )
  )
    throw new NevoboUpstreamError('Unsupported Nevobo point method.');

  const shapes = new Set(
    outcomes.map(({ setsA, setsB }) =>
      [Math.max(setsA, setsB), Math.min(setsA, setsB)].join('-'),
    ),
  );
  if (sameShapes(shapes, ['3-0', '3-1', '3-2'])) return 'best_of_5';
  if (sameShapes(shapes, ['4-0', '3-1', '2-2'])) return 'four_sets';
  if (sameShapes(shapes, ['4-0', '3-1', '3-2'])) return 'four_plus_one';
  throw new NevoboUpstreamError('Unsupported Nevobo point method.');
}

function sameShapes(actual: Set<string>, expected: string[]): boolean {
  return (
    actual.size === expected.length &&
    expected.every((shape) => actual.has(shape))
  );
}

function requireUuid(value: string): string {
  if (!z.string().uuid().safeParse(value).success) {
    throw new NevoboUpstreamError('Invalid Nevobo match identity.');
  }
  return value;
}

function normalizeStatus(value: string | undefined): string {
  return (value ?? '').trim().toLocaleLowerCase('nl-NL');
}
