import type { UpdateUserInformationInput } from '@repo/api';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

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

export function assertValidMembershipDates(
  userCreatedAt: Date,
  changes: UpdateUserInformationInput,
): void {
  const leaveDate = changes.leaveDate;
  const membershipStartDate = userCreatedAt.toISOString().slice(0, 10);
  if (
    leaveDate !== undefined &&
    leaveDate !== null &&
    leaveDate < membershipStartDate
  ) {
    throw new BadRequestException(
      'leaveDate cannot be before the user creation date.',
    );
  }
}
