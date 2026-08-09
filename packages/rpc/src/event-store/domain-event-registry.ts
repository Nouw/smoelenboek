import { DomainEventBase } from './domain-event';
import { StoredEventEntity } from './entities/stored-event.entity';

// Phase 1: teams
import {
  TEAM_ARCHIVED_EVENT,
  TEAM_CREATED_EVENT,
  TEAM_MEMBER_ASSIGNED_EVENT,
  TEAM_MEMBER_REMOVED_EVENT,
  TEAM_RESTORED_EVENT,
  TEAM_UPDATED_EVENT,
  TeamArchivedEvent,
  TeamCreatedEvent,
  TeamMemberAssignedEvent,
  TeamMemberRemovedEvent,
  TeamRestoredEvent,
  TeamUpdatedEvent,
} from '../teams/events/team-events';

// Phase 2: committees
import {
  COMMITTEE_ARCHIVED_EVENT,
  COMMITTEE_CREATED_EVENT,
  COMMITTEE_MEMBER_ASSIGNED_EVENT,
  COMMITTEE_MEMBER_REMOVED_EVENT,
  COMMITTEE_RESTORED_EVENT,
  COMMITTEE_UPDATED_EVENT,
  CommitteeArchivedEvent,
  CommitteeCreatedEvent,
  CommitteeMemberAssignedEvent,
  CommitteeMemberRemovedEvent,
  CommitteeRestoredEvent,
  CommitteeUpdatedEvent,
} from '../committees/events/committee-events';

// Phase 2: users
import {
  USER_INFORMATION_UPDATED_EVENT,
  UserInformationUpdatedEvent,
} from '../users/events/user-information-updated.event';
import {
  USER_PROFILE_UPDATED_EVENT,
  UserProfileUpdatedEvent,
} from '../users/events/user-profile-updated.event';
import {
  USER_PROVISIONED_EVENT,
  UserProvisionedEvent,
} from '../users/events/user-provisioned.event';
import {
  USER_SYNCED_FROM_AUTH_EVENT,
  UserSyncedFromAuthEvent,
} from '../users/events/user-synced-from-auth.event';

// Phase 3: polls
import {
  POLL_ARCHIVED_EVENT,
  POLL_CREATED_EVENT,
  POLL_DRAFT_DELETED_EVENT,
  POLL_PUBLISHED_EVENT,
  POLL_RESPONSE_SUBMITTED_EVENT,
  POLL_UPDATED_EVENT,
  PollArchivedEvent,
  PollCreatedEvent,
  PollDraftDeletedEvent,
  PollPublishedEvent,
  PollResponseSubmittedEvent,
  PollUpdatedEvent,
} from '../polls/events/poll.events';

// Phase 3: documents
import {
  ASSET_DELETED_EVENT,
  ASSET_SAVED_EVENT,
  ASSETS_REORDERED_EVENT,
  COLLECTION_DELETED_EVENT,
  COLLECTION_SAVED_EVENT,
  COLLECTIONS_REORDERED_EVENT,
  AssetDeletedEvent,
  AssetSavedEvent,
  AssetsReorderedEvent,
  CollectionDeletedEvent,
  CollectionSavedEvent,
  CollectionsReorderedEvent,
} from '../documents/events/document.events';

// Phase 2: protototo
import {
  PROTOTOTO_ENTRY_SUBMITTED_EVENT,
  PROTOTOTO_MATCH_REMOVED_EVENT,
  PROTOTOTO_MATCH_RESULT_SYNCED_EVENT,
  PROTOTOTO_MATCH_SAVED_EVENT,
  PROTOTOTO_ROUND_ARCHIVED_EVENT,
  PROTOTOTO_ROUND_PUBLISHED_EVENT,
  PROTOTOTO_ROUND_SAVED_EVENT,
  ProtototoEntrySubmittedEvent,
  ProtototoMatchRemovedEvent,
  ProtototoMatchResultSyncedEvent,
  ProtototoMatchSavedEvent,
  ProtototoRoundArchivedEvent,
  ProtototoRoundPublishedEvent,
  ProtototoRoundSavedEvent,
} from '../protototo/events/protototo.events';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DomainEventClass = new (payload: any, metadata: any) => DomainEventBase;

// Maps eventType string to class. Grows as modules are converted (Phases 1-3).
// The registry totality gate test (Phase 4) enforces that every non-legacy event type is covered.
const EVENT_CLASS_MAP = new Map<string, DomainEventClass>([
  [TEAM_CREATED_EVENT, TeamCreatedEvent],
  [TEAM_UPDATED_EVENT, TeamUpdatedEvent],
  [TEAM_ARCHIVED_EVENT, TeamArchivedEvent],
  [TEAM_RESTORED_EVENT, TeamRestoredEvent],
  [TEAM_MEMBER_ASSIGNED_EVENT, TeamMemberAssignedEvent],
  [TEAM_MEMBER_REMOVED_EVENT, TeamMemberRemovedEvent],
  [COMMITTEE_CREATED_EVENT, CommitteeCreatedEvent],
  [COMMITTEE_UPDATED_EVENT, CommitteeUpdatedEvent],
  [COMMITTEE_ARCHIVED_EVENT, CommitteeArchivedEvent],
  [COMMITTEE_RESTORED_EVENT, CommitteeRestoredEvent],
  [COMMITTEE_MEMBER_ASSIGNED_EVENT, CommitteeMemberAssignedEvent],
  [COMMITTEE_MEMBER_REMOVED_EVENT, CommitteeMemberRemovedEvent],
  [USER_PROVISIONED_EVENT, UserProvisionedEvent],
  [USER_SYNCED_FROM_AUTH_EVENT, UserSyncedFromAuthEvent],
  [USER_PROFILE_UPDATED_EVENT, UserProfileUpdatedEvent],
  [USER_INFORMATION_UPDATED_EVENT, UserInformationUpdatedEvent],
  [PROTOTOTO_ROUND_SAVED_EVENT, ProtototoRoundSavedEvent],
  [PROTOTOTO_ROUND_PUBLISHED_EVENT, ProtototoRoundPublishedEvent],
  [PROTOTOTO_ROUND_ARCHIVED_EVENT, ProtototoRoundArchivedEvent],
  [PROTOTOTO_MATCH_SAVED_EVENT, ProtototoMatchSavedEvent],
  [PROTOTOTO_MATCH_REMOVED_EVENT, ProtototoMatchRemovedEvent],
  [PROTOTOTO_ENTRY_SUBMITTED_EVENT, ProtototoEntrySubmittedEvent],
  [PROTOTOTO_MATCH_RESULT_SYNCED_EVENT, ProtototoMatchResultSyncedEvent],
  [POLL_CREATED_EVENT, PollCreatedEvent],
  [POLL_UPDATED_EVENT, PollUpdatedEvent],
  [POLL_PUBLISHED_EVENT, PollPublishedEvent],
  [POLL_ARCHIVED_EVENT, PollArchivedEvent],
  [POLL_DRAFT_DELETED_EVENT, PollDraftDeletedEvent],
  [POLL_RESPONSE_SUBMITTED_EVENT, PollResponseSubmittedEvent],
  [COLLECTION_SAVED_EVENT, CollectionSavedEvent],
  [COLLECTIONS_REORDERED_EVENT, CollectionsReorderedEvent],
  [COLLECTION_DELETED_EVENT, CollectionDeletedEvent],
  [ASSET_SAVED_EVENT, AssetSavedEvent],
  [ASSETS_REORDERED_EVENT, AssetsReorderedEvent],
  [ASSET_DELETED_EVENT, AssetDeletedEvent],
]);

export function rehydrate(row: StoredEventEntity): DomainEventBase | null {
  const Cls = EVENT_CLASS_MAP.get(row.eventType);
  if (!Cls) return null;
  return new Cls(row.payload, row.metadata);
}

export function registeredEventTypes(): string[] {
  return [...EVENT_CLASS_MAP.keys()];
}
