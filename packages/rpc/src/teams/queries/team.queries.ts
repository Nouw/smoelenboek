export class ListTeamsQuery {}

export class ListTeamMembershipsBySeasonQuery {
  constructor(public readonly seasonKey: number) {}
}
