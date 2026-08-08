import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { DomainEventDispatcher } from './domain-event-dispatcher';
import { rehydrate } from './domain-event-registry';
import { EventStoreRepository } from './repositories/event-store.repository';

@Injectable()
export class StoredEventSweeper implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StoredEventSweeper.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly eventStore: EventStoreRepository,
    private readonly dispatcher: DomainEventDispatcher,
  ) {}

  onModuleInit(): void {
    this.trigger();
    this.timer = setInterval(() => this.trigger(), 5_000);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private trigger(): void {
    void this.drain().catch((error) =>
      this.logger.error(JSON.stringify({
        event: 'event_store.sweep_failed',
        error: error instanceof Error ? error.message : String(error),
      })),
    );
  }

  async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const rows = await this.eventStore.claimDispatchable();
      for (const row of rows) {
        const event = rehydrate(row);
        if (!event) {
          await this.eventStore.markDispatchFailure(
            { ...row, dispatchAttempts: (row.dispatchAttempts ?? 0) },
            `No class registered for eventType: ${row.eventType}`,
          );
          this.logger.error(JSON.stringify({
            event: 'event_store.registry_miss',
            storedEventId: row.id,
            eventType: row.eventType,
          }));
          continue;
        }
        try {
          await this.dispatcher.dispatchStored(row, event);
        } catch (error) {
          // markDispatchFailure already called by dispatchStored; just log sweep context
          this.logger.warn(JSON.stringify({
            event: 'event_store.sweep_row_failed',
            storedEventId: row.id,
            eventType: row.eventType,
            error: error instanceof Error ? error.message : String(error),
          }));
        }
      }
    } finally {
      this.running = false;
    }
  }
}
