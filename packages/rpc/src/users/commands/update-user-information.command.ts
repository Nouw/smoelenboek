import type { UpdateUserInformationInput } from '@repo/api';

export class UpdateUserInformationCommand {
  constructor(
    public readonly actorUserId: string,
    public readonly actorRole: string | null,
    public readonly targetUserId: string,
    public readonly changes: UpdateUserInformationInput,
  ) {}
}
