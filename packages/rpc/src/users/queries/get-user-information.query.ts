export class GetUserInformationQuery {
  constructor(
    public readonly actorUserId: string,
    public readonly actorRole: string | null,
    public readonly targetUserId: string,
  ) {}
}
