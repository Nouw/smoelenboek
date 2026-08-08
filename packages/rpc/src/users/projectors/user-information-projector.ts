import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DataSource, EntityManager } from 'typeorm';

import { DomainEventBase } from '../../event-store/domain-event';
import { UserInformationEntity } from '../entities/user-information.entity';
import {
  UserInformationUpdatedEvent,
  type UserInformationUpdatedPayload,
} from '../events/user-information-updated.event';

@EventsHandler(UserInformationUpdatedEvent)
@Injectable()
export class UserInformationProjector implements IEventHandler<DomainEventBase> {
  constructor(private readonly dataSource: DataSource) {}

  async handle(event: DomainEventBase): Promise<void> {
    await this.projectUpdated(
      (event as UserInformationUpdatedEvent).payload,
      this.dataSource.manager,
    );
  }

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
