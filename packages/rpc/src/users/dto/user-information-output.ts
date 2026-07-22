import type { UserInformationDto } from '@repo/api';

import type { UserInformationEntity } from '../entities/user-information.entity';

export function toUserInformationDto(
  information: UserInformationEntity,
  includeBankAccountNumber: boolean,
): UserInformationDto {
  return {
    userId: information.userId,
    streetName: information.streetName,
    houseNumber: information.houseNumber,
    postcode: information.postcode,
    city: information.city,
    phoneNumber: information.phoneNumber,
    ...(includeBankAccountNumber
      ? { bankAccountNumber: information.bankAccountNumber }
      : {}),
    birthDate: information.birthDate,
    bondNumber: information.bondNumber,
    joinDate: information.joinDate,
    leaveDate: information.leaveDate,
    backNumber: information.backNumber,
    refereeLicense: information.refereeLicense,
    createdAt: information.createdAt.toISOString(),
    updatedAt: information.updatedAt.toISOString(),
  };
}
