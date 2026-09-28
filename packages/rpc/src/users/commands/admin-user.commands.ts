import type { CreateManagedUserInput, ManagedUserRole } from '@repo/api';

export class CreateManagedUserCommand {
  constructor(public readonly actorUserId: string, public readonly input: CreateManagedUserInput) {}
}
export class ResendUserInvitationCommand {
  constructor(public readonly actorUserId: string, public readonly userId: string) {}
}
export class SetManagedUserRoleCommand {
  constructor(
    public readonly actorUserId: string,
    public readonly targetUserId: string,
    public readonly role: ManagedUserRole,
  ) {}
}

export class DeregisterManagedUserCommand {
  constructor(public readonly actorUserId: string, public readonly targetUserId: string) {}
}

export class ReactivateManagedUserCommand {
  constructor(public readonly actorUserId: string, public readonly targetUserId: string) {}
}
