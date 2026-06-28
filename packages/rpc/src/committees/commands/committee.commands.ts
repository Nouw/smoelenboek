import type { CommitteeRole } from '@repo/api';

export class CreateCommitteeCommand {
  constructor(public readonly name: string) {}
}

export class UpdateCommitteeCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}
}

export class ArchiveCommitteeCommand {
  constructor(public readonly id: string) {}
}

export class AssignCommitteeMemberCommand {
  constructor(
    public readonly userId: string,
    public readonly committeeId: string,
    public readonly seasonId: string,
    public readonly role: CommitteeRole,
  ) {}
}

export class RemoveCommitteeMemberCommand {
  constructor(public readonly membershipId: string) {}
}

