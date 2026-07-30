import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, LessThanOrEqual, Repository } from 'typeorm';

import { ProtototoEntryEntity } from '../entities/protototo-entry.entity';
import { ProtototoMatchEntity } from '../entities/protototo-match.entity';
import { ProtototoPredictionEntity } from '../entities/protototo-prediction.entity';
import { ProtototoRoundEntity } from '../entities/protototo-round.entity';

@Injectable()
export class ProtototoRepository {
  constructor(
    @InjectRepository(ProtototoRoundEntity)
    private readonly rounds: Repository<ProtototoRoundEntity>,
    @InjectRepository(ProtototoMatchEntity)
    private readonly matches: Repository<ProtototoMatchEntity>,
    @InjectRepository(ProtototoEntryEntity)
    private readonly entries: Repository<ProtototoEntryEntity>,
    @InjectRepository(ProtototoPredictionEntity)
    private readonly predictions: Repository<ProtototoPredictionEntity>,
  ) {}

  findRound(id: string): Promise<ProtototoRoundEntity | null> {
    return this.rounds.findOne({
      where: { id },
      relations: { matches: true },
      order: { matches: { startsAt: 'ASC' } },
    });
  }

  findRoundForUpdate(
    id: string,
    manager: EntityManager,
  ): Promise<ProtototoRoundEntity | null> {
    return manager.getRepository(ProtototoRoundEntity).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
  }

  findCurrentRound(now: Date): Promise<ProtototoRoundEntity | null> {
    return this.rounds
      .createQueryBuilder('round')
      .leftJoinAndSelect('round.matches', 'match', 'match.removedAt IS NULL')
      .where('round.publishedAt IS NOT NULL')
      .andWhere('round.archivedAt IS NULL')
      .andWhere('round.opensAt <= :now', { now })
      .andWhere('round.closesAt > :now', { now })
      .orderBy('match.startsAt', 'ASC')
      .getOne();
  }

  findLatestPublishedRound(): Promise<ProtototoRoundEntity | null> {
    return this.rounds.findOne({
      where: { publishedAt: LessThanOrEqual(new Date()), archivedAt: IsNull() },
      order: { closesAt: 'DESC' },
      relations: { matches: true },
    });
  }

  listRounds(admin: boolean): Promise<ProtototoRoundEntity[]> {
    return this.rounds.find({
      where: admin ? {} : { archivedAt: IsNull() },
      relations: { matches: true },
      order: { createdAt: 'DESC', matches: { startsAt: 'ASC' } },
    });
  }

  findOverlappingPublishedRound(
    opensAt: Date,
    closesAt: Date,
    excludeId?: string,
  ): Promise<ProtototoRoundEntity | null> {
    const query = this.rounds
      .createQueryBuilder('round')
      .where('round.publishedAt IS NOT NULL')
      .andWhere('round.archivedAt IS NULL')
      .andWhere('round.opensAt < :closesAt', { closesAt })
      .andWhere('round.closesAt > :opensAt', { opensAt });

    if (excludeId) {
      query.andWhere('round.id != :excludeId', { excludeId });
    }

    return query.getOne();
  }

  findMatch(id: string): Promise<ProtototoMatchEntity | null> {
    return this.matches.findOneBy({ id });
  }

  findMatchByNevobo(
    roundId: string,
    nevoboMatchId: string,
  ): Promise<ProtototoMatchEntity | null> {
    return this.matches.findOneBy({ roundId, nevoboMatchId });
  }

  findActiveMatches(
    roundId: string,
    manager?: EntityManager,
  ): Promise<ProtototoMatchEntity[]> {
    return (manager?.getRepository(ProtototoMatchEntity) ?? this.matches).find({
      where: { roundId, removedAt: IsNull() },
      order: { startsAt: 'ASC' },
    });
  }

  findStartedUnfinishedMatches(now: Date): Promise<ProtototoMatchEntity[]> {
    return this.matches
      .createQueryBuilder('match')
      .innerJoin('match.round', 'round')
      .where('round.publishedAt IS NOT NULL')
      .andWhere('round.archivedAt IS NULL')
      .andWhere('match.removedAt IS NULL')
      .andWhere('match.startsAt <= :now', { now })
      .andWhere(
        '(match.resultStatus IS NULL OR match.resultStatus = :pending)',
        {
          pending: 'pending',
        },
      )
      .orderBy('match.startsAt', 'ASC')
      .getMany();
  }

  findMemberEntry(
    roundId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<ProtototoEntryEntity | null> {
    return (
      manager?.getRepository(ProtototoEntryEntity) ?? this.entries
    ).findOne({
      where: { roundId, userId },
      relations: { predictions: true },
    });
  }

  findAnonymousEntry(
    roundId: string,
    emailNormalized: string,
    manager?: EntityManager,
  ): Promise<ProtototoEntryEntity | null> {
    return (
      manager?.getRepository(ProtototoEntryEntity) ?? this.entries
    ).findOne({
      where: { roundId, emailNormalized },
      relations: { predictions: true },
    });
  }

  findEntry(id: string): Promise<ProtototoEntryEntity | null> {
    return this.entries.findOne({
      where: { id },
      relations: { predictions: true },
    });
  }

  findEntries(roundId: string): Promise<ProtototoEntryEntity[]> {
    return this.entries.find({
      where: { roundId },
      relations: { predictions: true },
      order: { firstName: 'ASC' },
    });
  }

  findPredictionsForRound(
    roundId: string,
  ): Promise<ProtototoPredictionEntity[]> {
    return this.predictions
      .createQueryBuilder('prediction')
      .innerJoinAndSelect('prediction.entry', 'entry')
      .innerJoinAndSelect('prediction.match', 'match')
      .where('entry.roundId = :roundId', { roundId })
      .getMany();
  }
}
