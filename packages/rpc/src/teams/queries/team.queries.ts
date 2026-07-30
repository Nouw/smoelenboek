export class ListTeamsQuery {}

export class ListTeamMembershipsBySeasonQuery {
  constructor(public readonly seasonKey: number) {}
}

export class GetCurrentTeamRosterQuery {
  constructor(
    public readonly teamId: string,
    public readonly at: Date,
  ) {}
}

export class GetTeamRosterForSeasonQuery {
  constructor(
    public readonly teamId: string,
    public readonly seasonKey: number,
  ) {}
}
