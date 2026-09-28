import { ForbiddenException } from '@nestjs/common';

export function canViewBankAccountNumber(
  actorUserId: string,
  actorRole: string | null,
  targetUserId: string,
): boolean {
  return actorUserId === targetUserId || actorRole === 'admin';
}

export function assertCanUpdateUserInformation(
  actorUserId: string,
  actorRole: string | null,
  targetUserId: string,
): void {
  if (actorUserId !== targetUserId && actorRole !== 'admin') {
    throw new ForbiddenException(
      'Only the owner or an admin can update user information.',
    );
  }
}
