import type { PollChoiceMode } from '@repo/api';

import type { DomainEvent } from '../../event-store/events';

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

type PollMetadata = { source: 'admin' | 'member'; actorId: string };

export function pollEvent(
  eventType:
    | 'poll.created'
    | 'poll.updated'
    | 'poll.published'
    | 'poll.archived',
  payload: PollSnapshotPayload,
  actorId: string,
): DomainEvent<PollSnapshotPayload, PollMetadata> {
  return {
    aggregateType: 'poll',
    aggregateId: payload.pollId,
    eventType,
    eventVersion: 1,
    payload,
    metadata: { source: 'admin', actorId },
  };
}

export function pollDeletedEvent(
  pollId: string,
  actorId: string,
): DomainEvent<{ pollId: string }, PollMetadata> {
  return {
    aggregateType: 'poll',
    aggregateId: pollId,
    eventType: 'poll.draft_deleted',
    eventVersion: 1,
    payload: { pollId },
    metadata: { source: 'admin', actorId },
  };
}

export function pollResponseEvent(
  payload: PollResponsePayload,
): DomainEvent<PollResponsePayload, PollMetadata> {
  return {
    aggregateType: 'poll_response',
    aggregateId: payload.responseId,
    eventType: 'poll.response_submitted',
    eventVersion: 1,
    payload,
    metadata: { source: 'member', actorId: payload.userId },
  };
}
