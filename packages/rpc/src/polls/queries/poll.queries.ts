export class ListMemberPollsQuery {
  constructor(
    public readonly userId: string,
    public readonly now = new Date(),
  ) {}
}

export class ListAdminPollsQuery {
  constructor(public readonly now = new Date()) {}
}

export class GetAdminPollQuery {
  constructor(
    public readonly pollId: string,
    public readonly now = new Date(),
  ) {}
}

export class GetPollResultsQuery {
  constructor(
    public readonly pollId: string,
    public readonly now = new Date(),
  ) {}
}
