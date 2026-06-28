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

