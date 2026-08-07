import type { CreateManagedUserInput } from '@repo/api';

export class CreateManagedUserCommand {
  constructor(public readonly actorUserId: string, public readonly input: CreateManagedUserInput) {}
}
export class ResendUserInvitationCommand {
  constructor(public readonly actorUserId: string, public readonly userId: string) {}
}
