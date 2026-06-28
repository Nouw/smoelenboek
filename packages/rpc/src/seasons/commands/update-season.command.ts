export class UpdateSeasonCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly startsAt: Date,
    public readonly endsAt: Date,
  ) {}
}

