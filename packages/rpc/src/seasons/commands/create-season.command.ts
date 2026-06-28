export class CreateSeasonCommand {
  constructor(
    public readonly name: string,
    public readonly startsAt: Date,
    public readonly endsAt: Date,
  ) {}
}

