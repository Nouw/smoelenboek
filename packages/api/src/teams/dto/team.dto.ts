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
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMembershipDto {
  id: string;
  userId: string;
  teamId: string;
  seasonId: string;
  role: TeamRole;
  createdAt: string;
  updatedAt: string;
}

