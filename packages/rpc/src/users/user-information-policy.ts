import type { UpdateUserInformationInput } from '@repo/api';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

import type { UserInformationEntity } from './entities/user-information.entity';

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
  existing: UserInformationEntity | null,
  changes: UpdateUserInformationInput,
): void {
  const joinDate =
    changes.joinDate !== undefined
      ? changes.joinDate
      : (existing?.joinDate ?? null);
  const leaveDate =
    changes.leaveDate !== undefined
      ? changes.leaveDate
      : (existing?.leaveDate ?? null);

  if (joinDate !== null && leaveDate !== null && leaveDate < joinDate) {
    throw new BadRequestException('leaveDate cannot be before joinDate.');
  }
}
