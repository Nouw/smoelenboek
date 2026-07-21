export class ListCommitteesQuery {}

export class ListCommitteeMembershipsBySeasonQuery {
  constructor(public readonly seasonKey: number) {}
}
