import type { DomainEvent } from '../../event-store/events';

export const SEASON_GENERATED_EVENT = 'season.generated';
export const SEASON_CREATED_EVENT = 'season.created';
export const SEASON_UPDATED_EVENT = 'season.updated';

export type SeasonSnapshotPayload = {
  seasonId: string;
  name: string;
  startsAt: string;
  endsAt: string;
};

export type SeasonGeneratedEvent = DomainEvent<
  SeasonSnapshotPayload,
  { source: 'season-generator' }
>;

export type SeasonCreatedEvent = DomainEvent<
  SeasonSnapshotPayload,
  { source: 'manual' }
>;

export type SeasonUpdatedEvent = DomainEvent<
  SeasonSnapshotPayload,
  { source: 'manual' }
>;

export type SeasonEvent =
  | SeasonGeneratedEvent
  | SeasonCreatedEvent
  | SeasonUpdatedEvent;

export function createSeasonGeneratedEvent(
  payload: SeasonSnapshotPayload,
): SeasonGeneratedEvent {
  return {
    aggregateType: 'season',
    aggregateId: payload.seasonId,
    eventType: SEASON_GENERATED_EVENT,
    eventVersion: 1,
    payload,
    metadata: { source: 'season-generator' },
  };
}

export function createSeasonCreatedEvent(
  payload: SeasonSnapshotPayload,
): SeasonCreatedEvent {
  return {
    aggregateType: 'season',
    aggregateId: payload.seasonId,
    eventType: SEASON_CREATED_EVENT,
    eventVersion: 1,
    payload,
    metadata: { source: 'manual' },
  };
}

export function createSeasonUpdatedEvent(
  payload: SeasonSnapshotPayload,
): SeasonUpdatedEvent {
  return {
    aggregateType: 'season',
    aggregateId: payload.seasonId,
    eventType: SEASON_UPDATED_EVENT,
    eventVersion: 1,
    payload,
    metadata: { source: 'manual' },
  };
}

