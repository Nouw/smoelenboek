import {
  Controller,
  Get,
  Header,
  HttpCode,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

type HealthResponse = {
  checks: { database: { status: 'down' | 'up' } };
  service: 'smoelenboek-rpc';
  status: 'error' | 'ok';
  timestamp: string;
};

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  @HttpCode(200)
  async check(): Promise<HealthResponse> {
    const timestamp = new Date().toISOString();

    try {
      await this.dataSource.query('SELECT 1');
      return {
        checks: { database: { status: 'up' } },
        service: 'smoelenboek-rpc',
        status: 'ok',
        timestamp,
      };
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'health.database_check_failed',
          error: error instanceof Error ? error.message : String(error),
        }),
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException({
        checks: { database: { status: 'down' } },
        service: 'smoelenboek-rpc',
        status: 'error',
        timestamp,
      } satisfies HealthResponse);
    }
  }
}
