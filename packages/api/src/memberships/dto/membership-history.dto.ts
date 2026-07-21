import type { CommitteeMembershipDto } from '../../committees/dto/committee.dto';
import type { TeamMembershipDto } from '../../teams/dto/team.dto';

export interface MembershipSeasonHistoryDto {
  seasonKey: number;
  label: string;
  startsOn: string;
  endsBefore: string;
  teamMemberships: TeamMembershipDto[];
  committeeMemberships: CommitteeMembershipDto[];
}

export interface MembershipHistoryDto {
  userId: string;
  seasonCount: number;
  seasons: MembershipSeasonHistoryDto[];
}
