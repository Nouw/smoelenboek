export type EntryPredictionInput = {
  matchId: string;
  setWinners: boolean[];
};

export class CreateProtototoRoundCommand {
  constructor(
    public readonly actorId: string,
    public readonly title: string,
    public readonly opensAt: Date,
    public readonly closesAt: Date,
    public readonly tikkieUrl: string | null,
  ) {}
}

export class UpdateProtototoRoundCommand {
  constructor(
    public readonly actorId: string,
    public readonly roundId: string,
    public readonly title: string,
    public readonly opensAt: Date,
    public readonly closesAt: Date,
    public readonly tikkieUrl: string | null,
  ) {}
}

export class PublishProtototoRoundCommand {
  constructor(
    public readonly actorId: string,
    public readonly roundId: string,
  ) {}
}

export class ArchiveProtototoRoundCommand {
  constructor(
    public readonly actorId: string,
    public readonly roundId: string,
  ) {}
}

export class AddProtototoMatchCommand {
  constructor(
    public readonly actorId: string,
    public readonly roundId: string,
    public readonly selectedTeamIri: string,
    public readonly nevoboMatchId: string,
  ) {}
}

export class RemoveProtototoMatchCommand {
  constructor(
    public readonly actorId: string,
    public readonly matchId: string,
  ) {}
}

export class SubmitProtototoEntryCommand {
  constructor(
    public readonly actorUserId: string | null,
    public readonly roundId: string,
    public readonly predictions: EntryPredictionInput[],
    public readonly firstName?: string,
    public readonly email?: string,
    public readonly paymentClaimed?: boolean,
    public readonly now: Date = new Date(),
  ) {}
}

export class SyncProtototoRoundCommand {
  constructor(
    public readonly roundId: string,
    public readonly actorId: string,
  ) {}
}
