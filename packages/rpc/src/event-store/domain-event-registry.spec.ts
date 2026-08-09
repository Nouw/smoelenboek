import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from '@jest/globals';

import {
  ASSET_DELETED_EVENT,
  ASSET_SAVED_EVENT,
  ASSETS_REORDERED_EVENT,
  COLLECTION_DELETED_EVENT,
  COLLECTION_SAVED_EVENT,
  COLLECTIONS_REORDERED_EVENT,
} from '../documents/events/document.events';
import {
  POLL_ARCHIVED_EVENT,
  POLL_CREATED_EVENT,
  POLL_DRAFT_DELETED_EVENT,
  POLL_PUBLISHED_EVENT,
  POLL_RESPONSE_SUBMITTED_EVENT,
  POLL_UPDATED_EVENT,
} from '../polls/events/poll.events';
import {
  PROTOTOTO_ENTRY_SUBMITTED_EVENT,
  PROTOTOTO_MATCH_REMOVED_EVENT,
  PROTOTOTO_MATCH_RESULT_SYNCED_EVENT,
  PROTOTOTO_MATCH_SAVED_EVENT,
  PROTOTOTO_ROUND_ARCHIVED_EVENT,
  PROTOTOTO_ROUND_PUBLISHED_EVENT,
  PROTOTOTO_ROUND_SAVED_EVENT,
} from '../protototo/events/protototo.events';
import {
  COMMITTEE_ARCHIVED_EVENT,
  COMMITTEE_CREATED_EVENT,
  COMMITTEE_MEMBER_ASSIGNED_EVENT,
  COMMITTEE_MEMBER_REMOVED_EVENT,
  COMMITTEE_RESTORED_EVENT,
  COMMITTEE_UPDATED_EVENT,
} from '../committees/events/committee-events';
import {
  TEAM_ARCHIVED_EVENT,
  TEAM_CREATED_EVENT,
  TEAM_MEMBER_ASSIGNED_EVENT,
  TEAM_MEMBER_REMOVED_EVENT,
  TEAM_RESTORED_EVENT,
  TEAM_UPDATED_EVENT,
} from '../teams/events/team-events';
import { USER_INFORMATION_UPDATED_EVENT } from '../users/events/user-information-updated.event';
import { USER_PROFILE_UPDATED_EVENT } from '../users/events/user-profile-updated.event';
import { USER_PROVISIONED_EVENT } from '../users/events/user-provisioned.event';
import { USER_SYNCED_FROM_AUTH_EVENT } from '../users/events/user-synced-from-auth.event';
import { StoredEventEntity } from './entities/stored-event.entity';
import { rehydrate, registeredEventTypes } from './domain-event-registry';

const ALL_KNOWN_EVENT_TYPES = [
  // Teams
  TEAM_CREATED_EVENT,
  TEAM_UPDATED_EVENT,
  TEAM_ARCHIVED_EVENT,
  TEAM_RESTORED_EVENT,
  TEAM_MEMBER_ASSIGNED_EVENT,
  TEAM_MEMBER_REMOVED_EVENT,
  // Committees
  COMMITTEE_CREATED_EVENT,
  COMMITTEE_UPDATED_EVENT,
  COMMITTEE_ARCHIVED_EVENT,
  COMMITTEE_RESTORED_EVENT,
  COMMITTEE_MEMBER_ASSIGNED_EVENT,
  COMMITTEE_MEMBER_REMOVED_EVENT,
  // Users
  USER_PROVISIONED_EVENT,
  USER_SYNCED_FROM_AUTH_EVENT,
  USER_PROFILE_UPDATED_EVENT,
  USER_INFORMATION_UPDATED_EVENT,
  // Protototo
  PROTOTOTO_ROUND_SAVED_EVENT,
  PROTOTOTO_ROUND_PUBLISHED_EVENT,
  PROTOTOTO_ROUND_ARCHIVED_EVENT,
  PROTOTOTO_MATCH_SAVED_EVENT,
  PROTOTOTO_MATCH_REMOVED_EVENT,
  PROTOTOTO_ENTRY_SUBMITTED_EVENT,
  PROTOTOTO_MATCH_RESULT_SYNCED_EVENT,
  // Polls
  POLL_CREATED_EVENT,
  POLL_UPDATED_EVENT,
  POLL_PUBLISHED_EVENT,
  POLL_ARCHIVED_EVENT,
  POLL_DRAFT_DELETED_EVENT,
  POLL_RESPONSE_SUBMITTED_EVENT,
  // Documents
  COLLECTION_SAVED_EVENT,
  COLLECTIONS_REORDERED_EVENT,
  COLLECTION_DELETED_EVENT,
  ASSET_SAVED_EVENT,
  ASSETS_REORDERED_EVENT,
  ASSET_DELETED_EVENT,
];

describe('domain-event-registry totality gate', () => {
  it('covers all 35 known non-legacy event types', () => {
    expect(registeredEventTypes()).toHaveLength(35);
  });

  it('every known event type is in the registry', () => {
    const registered = new Set(registeredEventTypes());
    for (const eventType of ALL_KNOWN_EVENT_TYPES) {
      expect(registered.has(eventType)).toBe(true);
    }
  });

  it('rehydrates every registered type to a non-null instance with matching eventType', () => {
    for (const eventType of registeredEventTypes()) {
      const row = { eventType, payload: {}, metadata: {} } as StoredEventEntity;
      const event = rehydrate(row);
      expect(event).not.toBeNull();
      expect(event!.eventType).toBe(eventType);
    }
  });

  it('toRecord() round-trips correctly for a rehydrated event', () => {
    const payload = { testId: 'round-trip' };
    const metadata = { source: 'manual', actorUserId: 'actor-1' };
    const row = {
      eventType: TEAM_CREATED_EVENT,
      payload,
      metadata,
    } as StoredEventEntity;
    const event = rehydrate(row)!;
    const record = event.toRecord();
    expect(record.eventType).toBe(TEAM_CREATED_EVENT);
    expect(record.payload).toEqual(payload);
    expect(record.metadata).toEqual(metadata);
  });

  it('returns null for an unregistered (legacy) event type', () => {
    const row = {
      eventType: 'legacy.unknown_type',
      payload: {},
      metadata: {},
    } as StoredEventEntity;
    expect(rehydrate(row)).toBeNull();
  });
});

describe('appendAndProject grep gate', () => {
  it('no source file outside the repository uses appendAndProject or appendPreparedAndProject', () => {
    const srcRoot = join(__dirname, '../..');
    const forbidden = ['appendAndProject', 'appendPreparedAndProject'];
    const violations: string[] = [];

    function scan(dir: string) {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          if (entry === 'node_modules' || entry === 'dist') continue;
          scan(full);
        } else if (
          entry.endsWith('.ts') &&
          !entry.endsWith('.spec.ts') &&
          !entry.endsWith('.d.ts')
        ) {
          // Skip the repository definition itself (it defines, not calls)
          if (full.includes('event-store.repository.ts')) continue;
          const content = readFileSync(full, 'utf8');
          for (const term of forbidden) {
            if (content.includes(term)) {
              violations.push(`${full}: contains '${term}'`);
            }
          }
        }
      }
    }

    scan(srcRoot);
    expect(violations).toEqual([]);
  });
});
