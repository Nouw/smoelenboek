# RPC observability

`rpc-telemetry.ts` adapts the global Nest logger to OpenTelemetry logs while retaining the normal
console output. It is enabled only when an OTLP endpoint is configured and uses OneUptime's
project-scoped `x-oneuptime-token` header.

The module owns exporter shutdown so the batch processor flushes when Nest receives a shutdown
signal. It intentionally does not create traces, metrics, request access logs, or frontend
telemetry.
