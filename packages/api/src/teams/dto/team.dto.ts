import type { SeasonDto } from '../../seasons/dto/season.dto';

export type TeamCategory = 'men' | 'women';

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
  category: TeamCategory;
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

export interface TeamRosterMembershipDto extends TeamMembershipDto {
  user: {
    id: string;
    name: string;
    email: string | null;
    imageUrl: string | null;
  };
}

export interface TeamRosterForSeasonDto {
  team: TeamDto;
  season: SeasonDto;
  memberships: TeamRosterMembershipDto[];
}
