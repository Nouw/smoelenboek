import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import { UserInformationEntity } from '../entities/user-information.entity';
import type { UserInformationUpdatedPayload } from '../events/user-information-updated.event';

@Injectable()
export class UserInformationProjector {
  async projectUpdated(
    payload: UserInformationUpdatedPayload,
    manager: EntityManager,
  ): Promise<UserInformationEntity> {
    const repository = manager.getRepository(UserInformationEntity);
    const existing = await repository.findOneBy({ userId: payload.userId });
    const entity =
      existing ??
      repository.create({
        userId: payload.userId,
        streetName: null,
        houseNumber: null,
        postcode: null,
        city: null,
        phoneNumber: null,
        bankAccountNumber: null,
        birthDate: null,
        bondNumber: null,
        leaveDate: null,
        backNumber: null,
        refereeLicense: null,
      });

    for (const [field, value] of Object.entries(payload.changes)) {
      if (field !== 'joinDate' && value !== undefined) {
        Object.assign(entity, { [field]: value });
      }
    }

    return repository.save(entity);
  }
}
