// Legacy alias kept for existing code that imports DomainEvent (plain object type).
// Will be removed in Phase 4 cleanup once all events are converted to classes.
export type DomainEvent<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
  TMetadata extends Record<string, unknown> = Record<string, unknown>,
> = {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  eventVersion: number;
  payload: TPayload;
  metadata: TMetadata;
};
