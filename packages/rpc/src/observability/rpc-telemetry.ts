import { ConsoleLogger } from '@nestjs/common';
import {
  SeverityNumber,
  type Logger as OpenTelemetryApiLogger,
} from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchLogRecordProcessor,
  LoggerProvider,
  type LogRecordExporter,
} from '@opentelemetry/sdk-logs';
import { format, stripVTControlCharacters } from 'node:util';

const defaultServiceName = 'smoelenboek-rpc';

export type RpcTelemetry = {
  enabled: boolean;
  forceFlush(): Promise<void>;
  logger: ConsoleLogger;
  shutdown(): Promise<void>;
};

type Environment = Record<string, string | undefined>;

let activeTelemetry: RpcTelemetry | null = null;

export function initializeRpcTelemetry(
  environment: Environment = process.env,
): RpcTelemetry {
  if (activeTelemetry) {
    return activeTelemetry;
  }

  activeTelemetry = createRpcTelemetry(environment);
  return activeTelemetry;
}

export function createRpcTelemetry(
  environment: Environment,
  exporter?: LogRecordExporter,
): RpcTelemetry {
  const configuration = resolveRpcLogExportConfig(environment);
  if (!configuration) {
    return disabledTelemetry();
  }

  const serviceName =
    environment.OTEL_SERVICE_NAME?.trim() || defaultServiceName;
  const resource = resourceFromAttributes({
    'deployment.environment.name':
      environment.NODE_ENV?.trim() || 'development',
    'service.name': serviceName,
  });
  const provider = new LoggerProvider({
    resource,
    processors: [
      new BatchLogRecordProcessor({
        exporter: exporter ?? new OTLPLogExporter(configuration),
      }),
    ],
  });

  return {
    enabled: true,
    forceFlush: () => provider.forceFlush(),
    logger: new OpenTelemetryConsoleLogger(provider.getLogger(serviceName)),
    shutdown: () => provider.shutdown(),
  };
}

export async function shutdownRpcTelemetry(): Promise<void> {
  const telemetry = activeTelemetry;
  activeTelemetry = null;
  await telemetry?.shutdown();
}

export class OpenTelemetryConsoleLogger extends ConsoleLogger {
  constructor(private readonly telemetryLogger?: OpenTelemetryApiLogger) {
    super();
  }

  override debug(message: unknown, ...optionalParams: unknown[]): void {
    this.emit(SeverityNumber.DEBUG, 'DEBUG', message, optionalParams);
    super.debug(message, ...optionalParams);
  }

  override error(message: unknown, ...optionalParams: unknown[]): void {
    this.emit(SeverityNumber.ERROR, 'ERROR', message, optionalParams);
    super.error(message, ...optionalParams);
  }

  override fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.emit(SeverityNumber.FATAL, 'FATAL', message, optionalParams);
    super.fatal(message, ...optionalParams);
  }

  override log(message: unknown, ...optionalParams: unknown[]): void {
    this.emit(SeverityNumber.INFO, 'INFO', message, optionalParams);
    super.log(message, ...optionalParams);
  }

  override verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.emit(SeverityNumber.TRACE, 'TRACE', message, optionalParams);
    super.verbose(message, ...optionalParams);
  }

  override warn(message: unknown, ...optionalParams: unknown[]): void {
    this.emit(SeverityNumber.WARN, 'WARN', message, optionalParams);
    super.warn(message, ...optionalParams);
  }

  private emit(
    severityNumber: SeverityNumber,
    severityText: string,
    message: unknown,
    optionalParams: unknown[],
  ): void {
    if (!this.telemetryLogger) {
      return;
    }

    const context = readContext(optionalParams);
    const exception = readException(message, optionalParams);

    try {
      this.telemetryLogger.emit({
        severityNumber,
        severityText,
        body: formatBody(message, optionalParams, context),
        attributes: {
          ...(context ? { 'code.namespace': context } : {}),
          ...(exception
            ? {
                'exception.message': exception.message,
                'exception.stacktrace': exception.stack ?? exception.message,
                'exception.type': exception.name,
              }
            : {}),
        },
        ...(exception ? { exception } : {}),
      });
    } catch {
      // Telemetry must never take down the application or recurse through its logger.
    }
  }
}

function disabledTelemetry(): RpcTelemetry {
  return {
    enabled: false,
    forceFlush: async () => undefined,
    logger: new OpenTelemetryConsoleLogger(),
    shutdown: async () => undefined,
  };
}

export function resolveRpcLogExportConfig(
  environment: Environment,
): { headers: Record<string, string>; url: string } | undefined {
  const signalEndpoint = firstNonEmpty(
    environment.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
  );
  const baseEndpoint = firstNonEmpty(environment.OTEL_EXPORTER_OTLP_ENDPOINT);
  const endpoint = signalEndpoint ?? baseEndpoint;
  if (!endpoint) {
    return undefined;
  }

  let parsedEndpoint: URL;
  try {
    parsedEndpoint = new URL(endpoint);
  } catch {
    throw new Error(
      'The OpenTelemetry logs endpoint must be a valid HTTP(S) URL.',
    );
  }

  if (!['http:', 'https:'].includes(parsedEndpoint.protocol)) {
    throw new Error('The OpenTelemetry logs endpoint must use HTTP or HTTPS.');
  }

  const headers = parseHeaders(
    firstNonEmpty(
      environment.OTEL_EXPORTER_OTLP_LOGS_HEADERS,
      environment.OTEL_EXPORTER_OTLP_HEADERS,
    ),
  );
  const hasOneUptimeToken = Object.entries(headers).some(
    ([name, value]) =>
      name.toLowerCase() === 'x-oneuptime-token' && value.length > 0,
  );
  if (!hasOneUptimeToken) {
    throw new Error(
      'OTEL_EXPORTER_OTLP_HEADERS or OTEL_EXPORTER_OTLP_LOGS_HEADERS must contain x-oneuptime-token when log telemetry is enabled.',
    );
  }

  if (!signalEndpoint) {
    parsedEndpoint.pathname = `${parsedEndpoint.pathname.replace(/\/+$/, '')}/v1/logs`;
  }

  return { headers, url: parsedEndpoint.toString() };
}

function firstNonEmpty(
  ...values: Array<string | undefined>
): string | undefined {
  return values.map((value) => value?.trim()).find((value) => Boolean(value));
}

function parseHeaders(value: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const header of value?.split(',') ?? []) {
    const separator = header.indexOf('=');
    if (separator < 1) {
      continue;
    }
    const name = decodeHeaderPart(header.slice(0, separator));
    if (name) {
      headers[name] = decodeHeaderPart(header.slice(separator + 1));
    }
  }
  return headers;
}

function decodeHeaderPart(value: string): string {
  const trimmed = value.trim();
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function readContext(optionalParams: unknown[]): string | undefined {
  const candidate = optionalParams.at(-1);
  return typeof candidate === 'string' && !looksLikeStackTrace(candidate)
    ? candidate
    : undefined;
}

function readException(
  message: unknown,
  optionalParams: unknown[],
): Error | undefined {
  const error = [message, ...optionalParams].find(
    (value) => value instanceof Error,
  );
  if (error instanceof Error) {
    return error;
  }

  const stack = optionalParams.find(
    (value): value is string =>
      typeof value === 'string' && looksLikeStackTrace(value),
  );
  if (!stack) {
    return undefined;
  }

  const inferred = new Error(
    typeof message === 'string' ? message : 'Application error',
  );
  inferred.stack = stack;
  return inferred;
}

function looksLikeStackTrace(value: string): boolean {
  return /(^|\n)\s*(?:[A-Za-z]*Error(?::|$)|at\s+\S+)/.test(value);
}

function formatBody(
  message: unknown,
  optionalParams: unknown[],
  context: string | undefined,
): string {
  const params = context ? optionalParams.slice(0, -1) : optionalParams;
  const rendered =
    message instanceof Error
      ? (message.stack ?? message.message)
      : format(message, ...params);
  return stripVTControlCharacters(rendered);
}
