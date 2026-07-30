import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';

import type { RpcEnv } from '../../config/env';
import { ProtototoResultSyncService } from './protototo-result-sync.service';

const INTERVAL_NAME = 'protototo-result-sync';

@Injectable()
export class ProtototoSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ProtototoSchedulerService.name);
  private running = false;

  constructor(
    private readonly scheduler: SchedulerRegistry,
    private readonly config: ConfigService<RpcEnv, true>,
    private readonly resultSync: ProtototoResultSyncService,
  ) {}

  onModuleInit(): void {
    const intervalMs = Number(
      this.config.get('PROTOTOTO_SYNC_INTERVAL_MS', { infer: true }),
    );
    const interval = setInterval(() => void this.pollNow(), intervalMs);
    this.scheduler.addInterval(INTERVAL_NAME, interval);
  }

  onModuleDestroy(): void {
    if (this.scheduler.doesExist('interval', INTERVAL_NAME)) {
      this.scheduler.deleteInterval(INTERVAL_NAME);
    }
  }

  async pollNow(now = new Date()): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      await this.resultSync.syncStarted(now);
    } catch (error) {
      this.logger.error({
        event: 'protototo_scheduled_sync_failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      this.running = false;
    }
  }
}
