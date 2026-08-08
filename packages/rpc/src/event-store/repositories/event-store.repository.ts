import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { DomainEventBase } from '../domain-event';
import { StoredEventEntity } from '../entities/stored-event.entity';

@Injectable()
export class EventStoreRepository {
  constructor(private readonly dataSource: DataSource) {}

  async append(event: DomainEventBase, manager?: EntityManager): Promise<StoredEventEntity> {
    const run = async (em: EntityManager) => {
      const repository = em.getRepository(StoredEventEntity);
      const record = event.toRecord();
      const entity = repository.create({
        ...record,
        dispatchStatus: 'pending',
        dispatchAttempts: 0,
        nextDispatchAt: new Date(),
        lastDispatchError: null,
      });
      return repository.save(entity);
    };
    return manager ? run(manager) : this.dataSource.transaction(run);
  }

  async appendPrepared(
    prepare: (manager: EntityManager) => Promise<DomainEventBase>,
  ): Promise<{ stored: StoredEventEntity; event: DomainEventBase }> {
    return this.dataSource.transaction(async (manager) => {
      const event = await prepare(manager);
      const stored = await this.append(event, manager);
      return { stored, event };
    });
  }

  async markDispatched(id: string): Promise<void> {
    await this.dataSource.getRepository(StoredEventEntity).update(id, {
      dispatchStatus: 'dispatched',
      lastDispatchError: null,
    });
  }

  async markDispatchFailure(row: StoredEventEntity, error: string): Promise<void> {
    const attempts = row.dispatchAttempts + 1;
    const final = attempts >= 8;
    const delayMs = Math.min(60 * 60_000, 2 ** attempts * 60_000);
    await this.dataSource.getRepository(StoredEventEntity).update(row.id, {
      dispatchStatus: final ? 'failed' : 'pending',
      dispatchAttempts: attempts,
      lastDispatchError: error.slice(0, 2000),
      nextDispatchAt: new Date(Date.now() + delayMs),
    });
  }

  async hasEarlierUndispatched(aggregateId: string, sequence: string): Promise<boolean> {
    const count: number = await this.dataSource
      .getRepository(StoredEventEntity)
      .createQueryBuilder('e')
      .where('e.aggregateId = :aggregateId', { aggregateId })
      .andWhere('CAST(e.sequence AS bigint) < CAST(:sequence AS bigint)', { sequence })
      .andWhere("e.dispatchStatus NOT IN ('dispatched', 'failed')")
      .getCount();
    return count > 0;
  }

  claimDispatchable(limit = 20): Promise<StoredEventEntity[]> {
    return this.dataSource.transaction(async (manager) => {
      const result: unknown = await manager.query(
        `UPDATE "stored_events" SET "dispatchStatus" = 'dispatching', "updatedAt" = now()
         WHERE "id" IN (
           SELECT e."id" FROM "stored_events" e
           WHERE (
             (e."dispatchStatus" = 'pending' AND e."nextDispatchAt" <= now())
             OR (e."dispatchStatus" = 'dispatching' AND e."updatedAt" < now() - interval '5 minutes')
           )
           AND NOT EXISTS (
             SELECT 1 FROM "stored_events" prior
             WHERE prior."aggregateId" = e."aggregateId"
               AND CAST(prior."sequence" AS bigint) < CAST(e."sequence" AS bigint)
               AND prior."dispatchStatus" NOT IN ('dispatched', 'failed')
           )
           ORDER BY CAST(e."sequence" AS bigint) FOR UPDATE SKIP LOCKED LIMIT $1
         )
         RETURNING *`,
        [limit],
      );
      const rows = unwrapAffectedRows(result);
      if (!rows.every(isStoredEvent)) {
        throw new Error('Stored event claim returned a row without an id.');
      }
      return rows;
    });
  }
}

function unwrapAffectedRows(result: unknown): unknown[] {
  if (!Array.isArray(result)) return [];
  if (result.length === 2 && Array.isArray(result[0]) && typeof result[1] === 'number') {
    return result[0];
  }
  return result;
}

function isStoredEvent(value: unknown): value is StoredEventEntity {
  return typeof value === 'object' && value !== null && typeof (value as { id?: unknown }).id === 'string';
}
