import type { UpdateUserProfileInput } from '@repo/api';

export class UpdateUserProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly input: UpdateUserProfileInput,
  ) {}
}
