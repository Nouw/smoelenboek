import type { CommitteeDto, CommitteeMembershipDto } from '@repo/api';

import type { CommitteeMembershipEntity } from '../entities/committee-membership.entity';
import type { CommitteeEntity } from '../entities/committee.entity';

export function toCommitteeDto(committee: CommitteeEntity): CommitteeDto {
  return {
    id: committee.id,
    name: committee.name,
    imageUrl: committee.imageUrl,
    archivedAt: committee.archivedAt?.toISOString() ?? null,
    createdAt: committee.createdAt.toISOString(),
    updatedAt: committee.updatedAt.toISOString(),
  };
}

export function toCommitteeMembershipDto(
  membership: CommitteeMembershipEntity,
): CommitteeMembershipDto {
  return {
    id: membership.id,
    userId: membership.userId,
    committeeId: membership.committeeId,
    seasonKey: membership.seasonKey,
    role: membership.role,
    startedOn: membership.startedOn,
    endedOn: membership.endedOn,
    createdAt: membership.createdAt.toISOString(),
    updatedAt: membership.updatedAt.toISOString(),
  };
}
