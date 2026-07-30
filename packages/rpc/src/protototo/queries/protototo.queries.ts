export class GetCurrentProtototoRoundQuery {
  constructor(
    public readonly userId: string | null,
    public readonly now: Date,
  ) {}
}

export class LookupAnonymousProtototoEntryQuery {
  constructor(
    public readonly roundId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly now: Date,
  ) {}
}

export class GetMemberProtototoEntryQuery {
  constructor(
    public readonly roundId: string,
    public readonly userId: string,
  ) {}
}

export class ListMemberProtototoRoundsQuery {}

export class GetProtototoStandingsQuery {
  constructor(
    public readonly roundId: string,
    public readonly now: Date,
  ) {}
}

export class ListAdminProtototoRoundsQuery {}

export class GetAdminProtototoRoundQuery {
  constructor(public readonly roundId: string) {}
}

export class ListAdminProtototoEntriesQuery {
  constructor(public readonly roundId: string) {}
}

export class ListNevoboTeamsQuery {}

export class ListNevoboMatchesQuery {
  constructor(public readonly selectedTeamIri: string) {}
}
