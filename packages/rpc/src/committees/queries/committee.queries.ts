export class ListCommitteesQuery {}

export class GetCurrentCommitteeRosterQuery {
  constructor(
    public readonly committeeId: string,
    public readonly at: Date,
  ) {}
}

export class ListCommitteeMembershipsBySeasonQuery {
  constructor(public readonly seasonKey: number) {}
}
