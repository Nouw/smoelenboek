import type { TeamRole } from '@repo/api';

export class CreateTeamCommand {
  constructor(public readonly name: string) {}
}

export class UpdateTeamCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}
}

export class ArchiveTeamCommand {
  constructor(public readonly id: string) {}
}

export class AssignTeamMemberCommand {
  constructor(
    public readonly userId: string,
    public readonly teamId: string,
    public readonly seasonId: string,
    public readonly role: TeamRole,
  ) {}
}

export class RemoveTeamMemberCommand {
  constructor(public readonly membershipId: string) {}
}

