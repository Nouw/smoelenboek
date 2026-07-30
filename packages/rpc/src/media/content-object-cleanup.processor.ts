import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { DocumentsRepository } from '../documents/repositories/documents.repository';
import { MediaService } from './media.service';

const cleanupIntervalMs = 60_000;

@Injectable()
export class ContentObjectCleanupProcessor
  implements OnModuleInit, OnModuleDestroy
{
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly mediaService: MediaService,
  ) {}

  onModuleInit(): void {
    this.triggerDrain();
    this.timer = setInterval(() => this.triggerDrain(), cleanupIntervalMs);
    this.timer.unref();
  }

  private triggerDrain(): void {
    void this.drain().catch((error) => {
      console.error(
        JSON.stringify({
          event: 'documents.object_cleanup_sweep_failed',
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    });
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      const pending = await this.documentsRepository.listPendingCleanup();

      for (const cleanup of pending) {
        try {
          await this.mediaService.deleteObjectByName(cleanup.objectName);
          await this.documentsRepository.completeCleanup(cleanup.id);
          console.info(
            JSON.stringify({
              event: 'documents.object_cleanup_completed',
              objectName: cleanup.objectName,
              attempts: cleanup.attempts + 1,
            }),
          );
        } catch (error) {
          const attempts = cleanup.attempts + 1;
          const delayMs = Math.min(60 * 60_000, 2 ** Math.min(attempts, 10) * 1000);
          const message = error instanceof Error ? error.message : String(error);
          await this.documentsRepository.markCleanupFailed(
            cleanup.id,
            message,
            new Date(Date.now() + delayMs),
          );
          console.warn(
            JSON.stringify({
              event: 'documents.object_cleanup_failed',
              objectName: cleanup.objectName,
              attempts,
              retryInMs: delayMs,
              error: message,
            }),
          );
        }
      }
    } finally {
      this.running = false;
    }
  }
}
