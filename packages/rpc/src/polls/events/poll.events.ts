import type { PollChoiceMode } from '@repo/api';

import { DomainEventBase } from '../../event-store/domain-event';

export const POLL_CREATED_EVENT = 'poll.created';
export const POLL_UPDATED_EVENT = 'poll.updated';
export const POLL_PUBLISHED_EVENT = 'poll.published';
export const POLL_ARCHIVED_EVENT = 'poll.archived';
export const POLL_DRAFT_DELETED_EVENT = 'poll.draft_deleted';
export const POLL_RESPONSE_SUBMITTED_EVENT = 'poll.response_submitted';

export type PollSnapshotPayload = {
  pollId: string;
  question: string;
  choiceMode: PollChoiceMode;
  opensAt: string;
  closesAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
  options: Array<{ id: string; label: string; position: number }>;
};

export type PollResponsePayload = {
  responseId: string;
  pollId: string;
  userId: string;
  optionIds: string[];
};

type PollAdminMetadata = { source: 'admin'; actorId: string };
type PollMemberMetadata = { source: 'member'; actorId: string };

export class PollCreatedEvent extends DomainEventBase<PollSnapshotPayload, PollAdminMetadata> {
  readonly aggregateType = 'poll';
  readonly eventType = POLL_CREATED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.pollId; }
  static create(payload: PollSnapshotPayload, actorId: string): PollCreatedEvent {
    return new PollCreatedEvent(payload, { source: 'admin', actorId });
  }
}

export class PollUpdatedEvent extends DomainEventBase<PollSnapshotPayload, PollAdminMetadata> {
  readonly aggregateType = 'poll';
  readonly eventType = POLL_UPDATED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.pollId; }
  static create(payload: PollSnapshotPayload, actorId: string): PollUpdatedEvent {
    return new PollUpdatedEvent(payload, { source: 'admin', actorId });
  }
}

export class PollPublishedEvent extends DomainEventBase<PollSnapshotPayload, PollAdminMetadata> {
  readonly aggregateType = 'poll';
  readonly eventType = POLL_PUBLISHED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.pollId; }
  static create(payload: PollSnapshotPayload, actorId: string): PollPublishedEvent {
    return new PollPublishedEvent(payload, { source: 'admin', actorId });
  }
}

export class PollArchivedEvent extends DomainEventBase<PollSnapshotPayload, PollAdminMetadata> {
  readonly aggregateType = 'poll';
  readonly eventType = POLL_ARCHIVED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.pollId; }
  static create(payload: PollSnapshotPayload, actorId: string): PollArchivedEvent {
    return new PollArchivedEvent(payload, { source: 'admin', actorId });
  }
}

export class PollDraftDeletedEvent extends DomainEventBase<{ pollId: string }, PollAdminMetadata> {
  readonly aggregateType = 'poll';
  readonly eventType = POLL_DRAFT_DELETED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.pollId; }
  static create(pollId: string, actorId: string): PollDraftDeletedEvent {
    return new PollDraftDeletedEvent({ pollId }, { source: 'admin', actorId });
  }
}

export class PollResponseSubmittedEvent extends DomainEventBase<PollResponsePayload, PollMemberMetadata> {
  readonly aggregateType = 'poll_response';
  readonly eventType = POLL_RESPONSE_SUBMITTED_EVENT;
  readonly eventVersion = 1;
  get aggregateId(): string { return this.payload.responseId; }
  static create(payload: PollResponsePayload): PollResponseSubmittedEvent {
    return new PollResponseSubmittedEvent(payload, { source: 'member', actorId: payload.userId });
  }
}
