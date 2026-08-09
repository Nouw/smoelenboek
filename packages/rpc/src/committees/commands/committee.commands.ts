import type { CommitteeRole } from '@repo/api';

export class CreateCommitteeCommand {
  constructor(
    public readonly name: string,
    public readonly actorUserId: string,
    public readonly imageUrl: string | null = null,
  ) {}
}

export class UpdateCommitteeCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly actorUserId: string,
    public readonly imageUrl: string | null | undefined = undefined,
  ) {}
}

export class ArchiveCommitteeCommand {
  constructor(
    public readonly id: string,
    public readonly actorUserId: string,
  ) {}
}

export class RestoreCommitteeCommand {
  constructor(
    public readonly id: string,
    public readonly actorUserId: string,
  ) {}
}

export class AssignCommitteeMemberCommand {
  constructor(
    public readonly userId: string,
    public readonly committeeId: string,
    public readonly role: CommitteeRole,
    public readonly seasonKey: number,
    public readonly startedOn: string,
    public readonly actorUserId: string,
  ) {}
}

export class RemoveCommitteeMemberCommand {
  constructor(
    public readonly membershipId: string,
    public readonly actorUserId: string,
  ) {}
}
