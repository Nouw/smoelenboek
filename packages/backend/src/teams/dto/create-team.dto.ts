import { Gender, TeamRank } from '../enums/team-rank.enum';

export class CreateTeamDto {
  name: string;
  gender: Gender;
  league: TeamRank;
}
