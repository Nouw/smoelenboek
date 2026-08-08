import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DataSource, EntityManager } from 'typeorm';

import { DomainEventBase } from '../../event-store/domain-event';
import { ProtototoEntryEntity } from '../entities/protototo-entry.entity';
import { ProtototoMatchEntity } from '../entities/protototo-match.entity';
import { ProtototoPredictionEntity } from '../entities/protototo-prediction.entity';
import { ProtototoRoundEntity } from '../entities/protototo-round.entity';
import {
  ProtototoEntrySubmittedEvent,
  ProtototoMatchRemovedEvent,
  ProtototoMatchResultSyncedEvent,
  ProtototoMatchSavedEvent,
  ProtototoRoundArchivedEvent,
  ProtototoRoundPublishedEvent,
  ProtototoRoundSavedEvent,
  type EntrySnapshotPayload,
  type MatchSnapshotPayload,
  type ResultSyncPayload,
  type RoundSnapshotPayload,
} from '../events/protototo.events';

@EventsHandler(
  ProtototoRoundSavedEvent,
  ProtototoRoundPublishedEvent,
  ProtototoRoundArchivedEvent,
  ProtototoMatchSavedEvent,
  ProtototoMatchRemovedEvent,
  ProtototoEntrySubmittedEvent,
  ProtototoMatchResultSyncedEvent,
)
@Injectable()
export class ProtototoProjector implements IEventHandler<DomainEventBase> {
  constructor(private readonly dataSource: DataSource) {}

  async handle(event: DomainEventBase): Promise<void> {
    if (event instanceof ProtototoEntrySubmittedEvent) {
      await this.dataSource.transaction((manager) =>
        this.projectEntry(event.payload, manager),
      );
    } else if (event instanceof ProtototoMatchResultSyncedEvent) {
      await this.dataSource.transaction((manager) =>
        this.projectResultSync(event.payload, manager),
      );
    } else if (
      event instanceof ProtototoMatchSavedEvent ||
      event instanceof ProtototoMatchRemovedEvent
    ) {
      await this.dataSource.transaction((manager) =>
        this.projectMatch(event.payload, manager),
      );
    } else {
      await this.dataSource.transaction((manager) =>
        this.projectRound(
          (event as ProtototoRoundSavedEvent).payload,
          manager,
        ),
      );
    }
  }

  async projectRound(
    payload: RoundSnapshotPayload,
    manager: EntityManager,
  ): Promise<ProtototoRoundEntity> {
    const repository = manager.getRepository(ProtototoRoundEntity);
    const entity =
      (await repository.findOne({
        where: { id: payload.roundId },
        lock: { mode: 'pessimistic_write' },
      })) ?? repository.create({ id: payload.roundId });

    entity.title = payload.title;
    entity.opensAt = new Date(payload.opensAt);
    entity.closesAt = new Date(payload.closesAt);
    entity.tikkieUrl = payload.tikkieUrl;
    entity.publishedAt = payload.publishedAt
      ? new Date(payload.publishedAt)
      : null;
    entity.archivedAt = payload.archivedAt
      ? new Date(payload.archivedAt)
      : null;
    return repository.save(entity);
  }

  async projectMatch(
    payload: MatchSnapshotPayload,
    manager: EntityManager,
  ): Promise<ProtototoMatchEntity> {
    await manager.getRepository(ProtototoRoundEntity).findOneOrFail({
      where: { id: payload.roundId },
      lock: { mode: 'pessimistic_write' },
    });
    const repository = manager.getRepository(ProtototoMatchEntity);
    const existing = await repository.findOne({
      where: { id: payload.matchId },
      lock: { mode: 'pessimistic_write' },
    });
    const entity =
      existing ??
      repository.create({
        id: payload.matchId,
        resultStatus: null,
        resultSetWinners: null,
        resultSyncedAt: null,
        lastSyncAttemptAt: null,
        lastSyncError: null,
      });

    Object.assign(entity, {
      roundId: payload.roundId,
      nevoboMatchId: payload.nevoboMatchId,
      selectedTeamIri: payload.selectedTeamIri,
      homeTeamIri: payload.homeTeamIri,
      homeTeamName: payload.homeTeamName,
      awayTeamIri: payload.awayTeamIri,
      awayTeamName: payload.awayTeamName,
      subjectSide: payload.subjectSide,
      format: payload.format,
      pointMethodIri: payload.pointMethodIri,
      startsAt: new Date(payload.startsAt),
      removedAt: payload.removedAt ? new Date(payload.removedAt) : null,
    });
    return repository.save(entity);
  }

  async projectEntry(
    payload: EntrySnapshotPayload,
    manager: EntityManager,
  ): Promise<ProtototoEntryEntity> {
    const entries = manager.getRepository(ProtototoEntryEntity);
    const predictions = manager.getRepository(ProtototoPredictionEntity);
    const entity =
      (await entries.findOneBy({ id: payload.entryId })) ??
      entries.create({ id: payload.entryId });

    Object.assign(entity, {
      roundId: payload.roundId,
      participantType: payload.participantType,
      userId: payload.userId,
      firstName: payload.firstName,
      email: payload.email,
      emailNormalized: payload.emailNormalized,
      firstNameNormalized: payload.firstNameNormalized,
      paymentClaimedAt: payload.paymentClaimedAt
        ? new Date(payload.paymentClaimedAt)
        : null,
    });
    const saved = await entries.save(entity);

    await predictions.delete({ entryId: payload.entryId });
    if (payload.predictions.length > 0) {
      await predictions.save(
        payload.predictions.map((prediction) =>
          predictions.create({
            id: prediction.predictionId,
            entryId: payload.entryId,
            matchId: prediction.matchId,
            setWinners: prediction.setWinners,
          }),
        ),
      );
    }
    saved.predictions = await predictions.findBy({ entryId: payload.entryId });
    return saved;
  }

  async projectResultSync(
    payload: ResultSyncPayload,
    manager: EntityManager,
  ): Promise<ProtototoMatchEntity> {
    const repository = manager.getRepository(ProtototoMatchEntity);
    const entity = await repository.findOneOrFail({
      where: { id: payload.matchId },
      lock: { mode: 'pessimistic_write' },
    });

    const currentResultIsTerminal =
      entity.resultStatus === 'final' || entity.resultStatus === 'cancelled';
    const incomingResultIsTerminal =
      payload.resultStatus === 'final' || payload.resultStatus === 'cancelled';
    const preserveCurrentResult =
      payload.error !== null ||
      (currentResultIsTerminal && !incomingResultIsTerminal);

    if (!preserveCurrentResult) {
      entity.resultStatus = payload.resultStatus;
      entity.resultSetWinners = payload.resultSetWinners;
      entity.resultSyncedAt = payload.resultSyncedAt
        ? new Date(payload.resultSyncedAt)
        : null;
    }
    entity.lastSyncAttemptAt = new Date(payload.attemptedAt);
    entity.lastSyncError = payload.error;
    return repository.save(entity);
  }
}
