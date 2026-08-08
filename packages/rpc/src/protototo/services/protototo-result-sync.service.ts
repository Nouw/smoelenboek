import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { EventStorePublisher } from '../../event-store/event-store.publisher';
import { ProtototoMatchEntity } from '../entities/protototo-match.entity';
import { ProtototoMatchResultSyncedEvent } from '../events/protototo.events';
import { NevoboClient } from '../nevobo/nevobo.client';
import { isValidPrediction } from '../protototo.policy';
import { ProtototoRepository } from '../repositories/protototo.repository';

export type ProtototoSyncSummary = {
  final: number;
  pending: number;
  cancelled: number;
  failed: number;
};

type SyncSource = 'nevobo_scheduler' | 'nevobo_manual';

@Injectable()
export class ProtototoResultSyncService {
  private readonly logger = new Logger(ProtototoResultSyncService.name);

  constructor(
    private readonly repository: ProtototoRepository,
    private readonly nevobo: NevoboClient,
    private readonly eventStorePublisher: EventStorePublisher,
  ) {}

  async syncRound(
    roundId: string,
    actorId: string,
    now = new Date(),
  ): Promise<ProtototoSyncSummary> {
    if (!(await this.repository.findRound(roundId))) {
      throw new NotFoundException('Protototo round not found.');
    }
    const matches = await this.repository.findActiveMatches(roundId);
    return this.syncMatches(matches, 'nevobo_manual', actorId, now, true);
  }

  async syncStarted(now = new Date()): Promise<ProtototoSyncSummary> {
    const matches = await this.repository.findStartedUnfinishedMatches(now);
    return this.syncMatches(matches, 'nevobo_scheduler', undefined, now, false);
  }

  private async syncMatches(
    matches: ProtototoMatchEntity[],
    source: SyncSource,
    actorId: string | undefined,
    now: Date,
    countCompleted: boolean,
  ): Promise<ProtototoSyncSummary> {
    const summary: ProtototoSyncSummary = {
      final: 0,
      pending: 0,
      cancelled: 0,
      failed: 0,
    };
    await Promise.all(
      matches.map(async (match) => {
        if (countCompleted && match.resultStatus === 'final') {
          summary.final += 1;
          return;
        }
        if (countCompleted && match.resultStatus === 'cancelled') {
          summary.cancelled += 1;
          return;
        }
        try {
          const result = await this.nevobo.getResult(
            match.nevoboMatchId,
            match.subjectSide,
          );
          if (
            result.status === 'final' &&
            !isValidPrediction(match.format, result.setWinners)
          ) {
            throw new BadRequestException(
              'The final Nevobo result does not match the stored match format.',
            );
          }
          await this.storeAttempt(
            match,
            source,
            actorId,
            now,
            result.status,
            result.setWinners,
            null,
          );
          summary[result.status] += 1;
        } catch (error) {
          summary.failed += 1;
          const message = safeSyncError(error);
          try {
            await this.storeAttempt(
              match,
              source,
              actorId,
              now,
              match.resultStatus,
              match.resultSetWinners,
              message,
            );
          } catch (storeError) {
            this.logger.error({
              event: 'protototo_sync_attempt_store_failed',
              matchId: match.id,
              error: safeSyncError(storeError),
            });
          }
        }
      }),
    );
    this.logger.log({
      event: 'protototo_results_synchronized',
      source,
      matchCount: matches.length,
      ...summary,
    });
    return summary;
  }

  private async storeAttempt(
    match: ProtototoMatchEntity,
    source: SyncSource,
    actorId: string | undefined,
    now: Date,
    resultStatus: 'pending' | 'final' | 'cancelled' | null,
    resultSetWinners: boolean[] | null,
    error: string | null,
  ): Promise<void> {
    const event = ProtototoMatchResultSyncedEvent.create(
      {
        matchId: match.id,
        resultStatus,
        resultSetWinners,
        resultSyncedAt:
          resultStatus === 'final'
            ? error
              ? (match.resultSyncedAt?.toISOString() ?? null)
              : now.toISOString()
            : null,
        attemptedAt: now.toISOString(),
        error,
      },
      source,
      actorId,
    );
    await this.eventStorePublisher.appendAndPublish(event);
  }
}

function safeSyncError(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 500);
  return 'Unknown Nevobo synchronization failure.';
}
