import { ConsoleLogger } from '@nestjs/common';
import { InMemoryLogRecordExporter } from '@opentelemetry/sdk-logs';
import { createRpcTelemetry, resolveRpcLogExportConfig } from './rpc-telemetry';

const enabledEnvironment = {
  NODE_ENV: 'test',
  OTEL_EXPORTER_OTLP_ENDPOINT: 'https://oneuptime.example/otlp',
  OTEL_EXPORTER_OTLP_HEADERS: 'x-oneuptime-token=test-token',
  OTEL_SERVICE_NAME: 'rpc-test',
};

describe('RPC log telemetry', () => {
  beforeEach(() => {
    jest
      .spyOn(ConsoleLogger.prototype, 'log')
      .mockImplementation(() => undefined);
    jest
      .spyOn(ConsoleLogger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exports Nest logs with service, environment, severity, and context', async () => {
    const exporter = new InMemoryLogRecordExporter();
    const telemetry = createRpcTelemetry(enabledEnvironment, exporter);

    telemetry.logger.log({ event: 'server.ready' }, 'Bootstrap');
    await telemetry.forceFlush();

    const [record] = exporter.getFinishedLogRecords();
    expect(record).toMatchObject({
      attributes: { 'code.namespace': 'Bootstrap' },
      body: "{ event: 'server.ready' }",
      severityText: 'INFO',
    });
    expect(record?.resource.attributes).toMatchObject({
      'deployment.environment.name': 'test',
      'service.name': 'rpc-test',
    });
    await telemetry.shutdown();
  });

  it('resolves the standard OneUptime path and ingestion header deterministically', () => {
    expect(resolveRpcLogExportConfig(enabledEnvironment)).toEqual({
      headers: { 'x-oneuptime-token': 'test-token' },
      url: 'https://oneuptime.example/otlp/v1/logs',
    });
    expect(
      resolveRpcLogExportConfig({
        ...enabledEnvironment,
        OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: 'http://collector:4318/custom/logs',
        OTEL_EXPORTER_OTLP_LOGS_HEADERS: 'x-oneuptime-token=signal-token',
      }),
    ).toEqual({
      headers: { 'x-oneuptime-token': 'signal-token' },
      url: 'http://collector:4318/custom/logs',
    });
  });

  it('emits OpenTelemetry exception attributes for Error values', async () => {
    const exporter = new InMemoryLogRecordExporter();
    const telemetry = createRpcTelemetry(enabledEnvironment, exporter);
    const error = new TypeError('database disconnected');

    telemetry.logger.error(error, 'HealthController');
    await telemetry.forceFlush();

    const [record] = exporter.getFinishedLogRecords();
    expect(record?.attributes).toMatchObject({
      'code.namespace': 'HealthController',
      'exception.message': 'database disconnected',
      'exception.stacktrace': expect.stringContaining(
        'TypeError: database disconnected',
      ),
      'exception.type': 'TypeError',
    });
    await telemetry.shutdown();
  });

  it('stays disabled without an OTLP endpoint', async () => {
    const telemetry = createRpcTelemetry({ NODE_ENV: 'test' });

    expect(telemetry.enabled).toBe(false);
    expect(resolveRpcLogExportConfig({ NODE_ENV: 'test' })).toBeUndefined();
    await expect(telemetry.forceFlush()).resolves.toBeUndefined();
    await expect(telemetry.shutdown()).resolves.toBeUndefined();
  });

  it('rejects invalid or unauthenticated OneUptime endpoints', () => {
    expect(() =>
      createRpcTelemetry({
        OTEL_EXPORTER_OTLP_ENDPOINT: 'not-a-url',
        OTEL_EXPORTER_OTLP_HEADERS: 'x-oneuptime-token=test-token',
      }),
    ).toThrow('valid HTTP(S) URL');
    expect(() =>
      createRpcTelemetry({
        OTEL_EXPORTER_OTLP_ENDPOINT: 'https://oneuptime.example/otlp',
      }),
    ).toThrow('x-oneuptime-token');
    expect(() =>
      createRpcTelemetry({
        OTEL_EXPORTER_OTLP_ENDPOINT: 'https://oneuptime.example/otlp',
        OTEL_EXPORTER_OTLP_HEADERS: 'x-oneuptime-token=',
      }),
    ).toThrow('x-oneuptime-token');
  });
});
