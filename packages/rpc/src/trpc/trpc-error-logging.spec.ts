import { ConsoleLogger, Logger } from '@nestjs/common';
import { InMemoryLogRecordExporter } from '@opentelemetry/sdk-logs';
import { TRPCError } from '@trpc/server';
import express from 'express';
import request from 'supertest';
import { createRpcTelemetry } from '../observability/rpc-telemetry';
import { TrpcHost } from './trpc.host';

describe('tRPC error logging through the Express adapter', () => {
  afterEach(() => {
    Logger.overrideLogger(new ConsoleLogger());
    jest.restoreAllMocks();
  });

  it.each([
    ['INTERNAL_SERVER_ERROR', 500],
    ['SERVICE_UNAVAILABLE', 503],
  ] as const)(
    'exports %s safely to the configured OTLP logger',
    async (
      code: 'INTERNAL_SERVER_ERROR' | 'SERVICE_UNAVAILABLE',
      status: number,
    ) => {
      jest
        .spyOn(ConsoleLogger.prototype, 'error')
        .mockImplementation(() => undefined);
      const exporter = new InMemoryLogRecordExporter();
      const telemetry = createRpcTelemetry(
        {
          OTEL_EXPORTER_OTLP_ENDPOINT: 'https://oneuptime.example/otlp',
          OTEL_EXPORTER_OTLP_HEADERS: 'x-oneuptime-token=test-token',
        },
        exporter,
      );
      Logger.overrideLogger(telemetry.logger);
      const cause = new Error(
        'SQL failed with private-search and secret-token',
      );
      const app = createApp(() =>
        Promise.reject(new TRPCError({ code, cause })),
      );

      try {
        await request(app)
          .get('/trpc/user.search')
          .query({ input: JSON.stringify({ query: 'private-search' }) })
          .set('Authorization', 'Bearer secret-token')
          .expect(status);
        await telemetry.forceFlush();
        const records = exporter.getFinishedLogRecords();
        expect(records).toHaveLength(1);
        expect(records[0]).toMatchObject({
          severityText: 'ERROR',
          attributes: {
            'code.namespace': 'TrpcHost',
            'exception.type': 'TRPCError',
            'exception.message': `tRPC query user.search failed (${code})`,
            'exception.stacktrace': expect.stringContaining(
              'trpc-error-logging.spec.ts',
            ),
          },
        });
        const exported = JSON.stringify({
          body: records[0]?.body,
          attributes: records[0]?.attributes,
        });
        expect(exported).not.toContain('private-search');
        expect(exported).not.toContain('secret-token');
        expect(exported).not.toContain('SQL failed');
      } finally {
        await telemetry.shutdown();
      }
    },
  );

  it('does not log successful requests or expected client errors', async () => {
    const log = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const app = createApp(() => Promise.resolve([]));
    await request(app)
      .get('/trpc/user.search')
      .query({ input: JSON.stringify({ query: 'valid' }) })
      .expect(200);
    await request(app)
      .get('/trpc/user.search')
      .query({ input: JSON.stringify({ query: 123 }) })
      .expect(400);
    const anonymousApp = createApp(() => Promise.resolve([]), null);
    await request(anonymousApp)
      .get('/trpc/user.search')
      .query({ input: JSON.stringify({ query: 'valid' }) })
      .expect(401);
    expect(log).not.toHaveBeenCalled();
  });
});

function createApp(
  execute: () => Promise<unknown>,
  userId: string | null = 'test-user',
) {
  const app = express();
  const host = new TrpcHost(
    { create: async () => ({ userId }) } as never,
    { execute: jest.fn() } as never,
    { execute } as never,
  );
  host.applyMiddleware({
    getHttpAdapter: () => ({ getInstance: () => app }),
  } as never);
  return app;
}
