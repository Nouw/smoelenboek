import type { IEvent } from '@nestjs/cqrs';

export type DomainEventRecord<
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

export abstract class DomainEventBase<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
  TMetadata extends Record<string, unknown> = Record<string, unknown>,
> implements IEvent {
  abstract readonly aggregateType: string;
  abstract readonly eventType: string;
  abstract readonly eventVersion: number;
  abstract get aggregateId(): string;

  constructor(
    readonly payload: TPayload,
    readonly metadata: TMetadata,
  ) {}

  toRecord(): DomainEventRecord<TPayload, TMetadata> {
    return {
      aggregateType: this.aggregateType,
      aggregateId: this.aggregateId,
      eventType: this.eventType,
      eventVersion: this.eventVersion,
      payload: this.payload,
      metadata: this.metadata,
    };
  }
}
