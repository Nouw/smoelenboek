import type { PollChoiceMode } from '@repo/api';

export class CreatePollCommand {
  constructor(
    public readonly actorId: string,
    public readonly question: string,
    public readonly choiceMode: PollChoiceMode,
    public readonly opensAt: Date,
    public readonly closesAt: Date,
    public readonly options: string[],
  ) {}
}

export class UpdatePollCommand extends CreatePollCommand {
  constructor(
    actorId: string,
    public readonly pollId: string,
    question: string,
    choiceMode: PollChoiceMode,
    opensAt: Date,
    closesAt: Date,
    options: string[],
  ) {
    super(actorId, question, choiceMode, opensAt, closesAt, options);
  }
}

export class PublishPollCommand {
  constructor(
    public readonly actorId: string,
    public readonly pollId: string,
    public readonly now = new Date(),
  ) {}
}

export class ArchivePollCommand {
  constructor(
    public readonly actorId: string,
    public readonly pollId: string,
    public readonly now = new Date(),
  ) {}
}

export class DeleteDraftPollCommand {
  constructor(
    public readonly actorId: string,
    public readonly pollId: string,
  ) {}
}

export class SubmitPollVoteCommand {
  constructor(
    public readonly userId: string,
    public readonly pollId: string,
    public readonly optionIds: string[],
    public readonly now = new Date(),
  ) {}
}
