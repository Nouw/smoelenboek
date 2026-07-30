import { ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import {
  toAdminEntryOutput,
  toEntryOutput,
  toRoundOutput,
} from '../dto/protototo-output';
import {
  isRoundOpen,
  normalizeEmail,
  normalizeFirstName,
} from '../protototo.policy';
import { NevoboClient } from '../nevobo/nevobo.client';
import { ProtototoRepository } from '../repositories/protototo.repository';
import {
  GetAdminProtototoRoundQuery,
  GetCurrentProtototoRoundQuery,
  GetMemberProtototoEntryQuery,
  GetProtototoStandingsQuery,
  ListAdminProtototoEntriesQuery,
  ListAdminProtototoRoundsQuery,
  ListMemberProtototoRoundsQuery,
  ListNevoboMatchesQuery,
  ListNevoboTeamsQuery,
  LookupAnonymousProtototoEntryQuery,
} from './protototo.queries';

@QueryHandler(GetCurrentProtototoRoundQuery)
export class GetCurrentProtototoRoundHandler
  implements IQueryHandler<GetCurrentProtototoRoundQuery>
{
  constructor(private readonly repository: ProtototoRepository) {}

  async execute(query: GetCurrentProtototoRoundQuery) {
    const round = await this.repository.findCurrentRound(query.now);
    if (!round) return null;
    const entry = query.userId
      ? await this.repository.findMemberEntry(round.id, query.userId)
      : null;
    return {
      round: toRoundOutput(round, query.now, false, query.userId === null),
      entry: entry ? toEntryOutput(entry) : null,
    };
  }
}

@QueryHandler(LookupAnonymousProtototoEntryQuery)
export class LookupAnonymousProtototoEntryHandler
  implements IQueryHandler<LookupAnonymousProtototoEntryQuery>
{
  constructor(private readonly repository: ProtototoRepository) {}

  async execute(query: LookupAnonymousProtototoEntryQuery) {
    const round = await this.repository.findRound(query.roundId);
    if (!round || !isRoundOpen(round, query.now)) {
      throw new ForbiddenException('Betting is not open for this round.');
    }
    const entry = await this.repository.findAnonymousEntry(
      query.roundId,
      normalizeEmail(query.email),
    );
    if (!entry) return null;
    if (entry.firstNameNormalized !== normalizeFirstName(query.firstName)) {
      return null;
    }
    return toEntryOutput(entry);
  }
}

@QueryHandler(GetMemberProtototoEntryQuery)
export class GetMemberProtototoEntryHandler
  implements IQueryHandler<GetMemberProtototoEntryQuery>
{
  constructor(private readonly repository: ProtototoRepository) {}
  async execute(query: GetMemberProtototoEntryQuery) {
    const entry = await this.repository.findMemberEntry(
      query.roundId,
      query.userId,
    );
    return entry ? toEntryOutput(entry) : null;
  }
}

@QueryHandler(ListMemberProtototoRoundsQuery)
export class ListMemberProtototoRoundsHandler
  implements IQueryHandler<ListMemberProtototoRoundsQuery>
{
  constructor(private readonly repository: ProtototoRepository) {}
  async execute() {
    const now = new Date();
    const rounds = await this.repository.listRounds(false);
    return rounds
      .filter((round) => round.publishedAt !== null)
      .map((round) =>
        toRoundOutput(
          round,
          now,
          false,
          false,
          now.getTime() >= round.closesAt.getTime(),
        ),
      );
  }
}

@QueryHandler(GetProtototoStandingsQuery)
export class GetProtototoStandingsHandler
  implements IQueryHandler<GetProtototoStandingsQuery>
{
  private readonly logger = new Logger(GetProtototoStandingsHandler.name);
  constructor(private readonly repository: ProtototoRepository) {}

  async execute(query: GetProtototoStandingsQuery) {
    const round = await this.repository.findRound(query.roundId);
    if (!round || !round.publishedAt || round.archivedAt) {
      throw new NotFoundException('Published Protototo round not found.');
    }
    if (query.now.getTime() < round.closesAt.getTime()) {
      throw new ForbiddenException(
        'Standings are hidden until betting closes.',
      );
    }
    const matches = (round.matches ?? []).filter(
      (match) => match.removedAt === null,
    );
    const entries = await this.repository.findEntries(round.id);
    const rows = entries
      .map((entry) => toAdminEntryOutput(entry, matches))
      .sort(
        (left, right) =>
          right.totalPoints - left.totalPoints ||
          left.displayName.localeCompare(right.displayName, 'nl'),
      )
      .map((entry, _index, all) => ({
        rank:
          all.findIndex(
            (candidate) => candidate.totalPoints === entry.totalPoints,
          ) + 1,
        entryId: entry.id,
        displayName: entry.displayName,
        participantType: entry.participantType,
        totalPoints: entry.totalPoints,
        matchPoints: entry.matchPoints,
      }));
    this.logger.debug({
      event: 'protototo_standings_loaded',
      roundId: round.id,
      participantCount: rows.length,
      finalMatchCount: matches.filter((match) => match.resultSyncedAt).length,
    });
    return rows;
  }
}

@QueryHandler(ListAdminProtototoRoundsQuery)
export class ListAdminProtototoRoundsHandler
  implements IQueryHandler<ListAdminProtototoRoundsQuery>
{
  constructor(private readonly repository: ProtototoRepository) {}
  async execute() {
    const rounds = await this.repository.listRounds(true);
    const now = new Date();
    return rounds.map((round) => toRoundOutput(round, now, true, true, true));
  }
}

@QueryHandler(GetAdminProtototoRoundQuery)
export class GetAdminProtototoRoundHandler
  implements IQueryHandler<GetAdminProtototoRoundQuery>
{
  constructor(private readonly repository: ProtototoRepository) {}
  async execute(query: GetAdminProtototoRoundQuery) {
    const round = await this.repository.findRound(query.roundId);
    return round ? toRoundOutput(round, new Date(), true, true, true) : null;
  }
}

@QueryHandler(ListAdminProtototoEntriesQuery)
export class ListAdminProtototoEntriesHandler
  implements IQueryHandler<ListAdminProtototoEntriesQuery>
{
  constructor(private readonly repository: ProtototoRepository) {}
  async execute(query: ListAdminProtototoEntriesQuery) {
    const round = await this.repository.findRound(query.roundId);
    if (!round) throw new NotFoundException('Protototo round not found.');
    const matches = round.matches.filter((match) => match.removedAt === null);
    const entries = await this.repository.findEntries(round.id);
    return entries.map((entry) => toAdminEntryOutput(entry, matches));
  }
}

@QueryHandler(ListNevoboTeamsQuery)
export class ListNevoboTeamsHandler
  implements IQueryHandler<ListNevoboTeamsQuery>
{
  constructor(private readonly nevobo: NevoboClient) {}

  execute() {
    return this.nevobo.listTeams();
  }
}

@QueryHandler(ListNevoboMatchesQuery)
export class ListNevoboMatchesHandler
  implements IQueryHandler<ListNevoboMatchesQuery>
{
  constructor(private readonly nevobo: NevoboClient) {}

  execute(query: ListNevoboMatchesQuery) {
    return this.nevobo.listMatches(query.selectedTeamIri);
  }
}
