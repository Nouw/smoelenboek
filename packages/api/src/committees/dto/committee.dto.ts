import type { SeasonDto } from '../../seasons/dto/season.dto';

export type CommitteeRole =
  | 'commissielid'
  | 'commissaris_externe_zaken'
  | 'wedstrijdsecretaris'
  | 'penningmeester'
  | 'commissaris_zaalwacht_en_arbitrage'
  | 'voorzitter'
  | 'secretaris';

export interface CommitteeDto {
  id: string;
  name: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommitteeMembershipDto {
  id: string;
  userId: string;
  committeeId: string;
  seasonKey: number;
  role: CommitteeRole;
  startedOn: string;
  endedOn: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommitteeRosterMemberDto {
  userId: string;
  name: string;
  imageUrl: string | null;
  role: CommitteeRole;
}

export interface CurrentCommitteeRosterDto {
  committee: CommitteeDto;
  season: SeasonDto;
  members: CommitteeRosterMemberDto[];
}
