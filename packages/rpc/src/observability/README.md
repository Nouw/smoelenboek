# RPC observability

`rpc-telemetry.ts` adapts the global Nest logger to OpenTelemetry logs while retaining the normal
console output. It is enabled only when an OTLP endpoint is configured and uses OneUptime's
project-scoped `x-oneuptime-token` header.

The module owns exporter shutdown so the batch processor flushes when Nest receives a shutdown
signal. It intentionally does not create traces, metrics, request access logs, or frontend
telemetry.

The Express tRPC adapter reports server failures (HTTP 5xx) through `TrpcHost`'s
Nest logger. tRPC handles these errors itself, so they do not reach Nest's
exception filter. Exported errors include the procedure path, operation type,
tRPC error code and stack location frames. Request inputs, headers, original
error messages, SQL parameters and error causes are omitted to avoid leaking
member data or credentials. Expected client errors (HTTP 4xx) are not logged.
In OneUptime, filter `service.name=smoelenboek-rpc`, severity `ERROR`, and
`code.namespace=TrpcHost`. An OTLP endpoint and ingestion key must be configured
for export; without them the errors still appear in the server console.
