import type { TeamCategory, TeamRole } from '@repo/api';

export class CreateTeamCommand {
  constructor(
    public readonly name: string,
    public readonly category: TeamCategory,
    public readonly actorUserId: string,
    public readonly imageUrl: string | null = null,
  ) {}
}

export class UpdateTeamCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly category: TeamCategory,
    public readonly actorUserId: string,
    public readonly imageUrl: string | null | undefined = undefined,
  ) {}
}

export class ArchiveTeamCommand {
  constructor(
    public readonly id: string,
    public readonly actorUserId: string,
  ) {}
}

export class RestoreTeamCommand {
  constructor(
    public readonly id: string,
    public readonly actorUserId: string,
  ) {}
}

export class AssignTeamMemberCommand {
  constructor(
    public readonly userId: string,
    public readonly teamId: string,
    public readonly role: TeamRole,
    public readonly seasonKey: number,
    public readonly startedOn: string,
    public readonly actorUserId: string,
  ) {}
}

export class RemoveTeamMemberCommand {
  constructor(
    public readonly membershipId: string,
    public readonly actorUserId: string,
  ) {}
}
