import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { UpdateUserInformationInput } from '@repo/api';
import { EmailOutboxRepository } from '../../email/email-outbox.repository';
import { UsersRepository } from '../repositories/users.repository';
import { UserInformationUpdatedEvent } from '../events/user-information-updated.event';
import { UserInformationRepository } from '../repositories/user-information.repository';

const ADDRESS_KEYS: Array<keyof UpdateUserInformationInput> = ['houseNumber', 'streetName', 'postcode', 'city'];

@EventsHandler(UserInformationUpdatedEvent)
@Injectable()
export class UserInformationUpdatedHandler
  implements IEventHandler<UserInformationUpdatedEvent>
{
  private readonly logger = new Logger(UserInformationUpdatedHandler.name);

  constructor(
    private readonly outbox: EmailOutboxRepository,
    private readonly userRepository: UsersRepository,
    private readonly userInformationRepository: UserInformationRepository,
  ) {}

  async handle(event: UserInformationUpdatedEvent): Promise<void> {
    const user = await this.userRepository.findById(event.payload.userId);
    const userInformation = await this.userInformationRepository.findByUserId(
      event.payload.userId,
    );

    if (!userInformation || !user) {
      return;
    }

    const name = `${user.firstName} ${user.lastName}`.trim();
    const changes = event.payload.changes;

    if (ADDRESS_KEYS.some((key) => key in changes)) {
      const newAddress = `${changes.streetName ?? userInformation.streetName} ${changes.houseNumber ?? userInformation.houseNumber} ${changes.postcode ?? userInformation.postcode} ${changes.city ?? userInformation.city}`;

      await this.outbox.enqueue({
        messageType: 'address_update',
        recipient: 'secretaris@usvprotos.nl',
        locale: 'nl',
        name,
        newAddress,
        relatedUserId: user.id,
        deduplicationKey: `address_update:${user.id}:${randomUUID()}`,
      });


      await this.outbox.enqueue({
        messageType: 'address_update',
        recipient: 'penningmeester@usvprotos.nl',
        locale: 'nl',
        name,
        newAddress,
        relatedUserId: user.id,
        deduplicationKey: `address_update:${user.id}:${randomUUID()}`,
      });

      this.logger.log(
        JSON.stringify({
          event: 'email.address_update_queued',
          userId: user.id,
        }),
      );
    }

    if (changes.bankAccountNumber !== undefined && changes.bankAccountNumber !== null) {
      await this.outbox.enqueue({
        messageType: 'bankaccount_update',
        recipient: 'penningmeester@usvprotos.nl',
        locale: 'nl',
        name,
        newBankaccount: changes.bankAccountNumber!,
        relatedUserId: user.id,
        deduplicationKey: `bankaccount_update:${user.id}:${randomUUID()}`,
      });
    }
  }
}
