import type { SeasonDto } from '../../seasons/dto/season.dto';

export type TeamRole =
  | 'libero'
  | 'middle'
  | 'coach_trainer'
  | 'setter'
  | 'outside_hitter'
  | 'opposite_hitter';

export interface TeamDto {
  id: string;
  name: string;
  imageUrl: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMembershipDto {
  id: string;
  userId: string;
  teamId: string;
  seasonKey: number;
  role: TeamRole;
  startedOn: string;
  endedOn: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamRosterMemberDto {
  userId: string;
  name: string;
  imageUrl: string | null;
  role: TeamRole;
}

export interface CurrentTeamRosterDto {
  team: TeamDto;
  season: SeasonDto;
  coaches: TeamRosterMemberDto[];
  players: TeamRosterMemberDto[];
}
