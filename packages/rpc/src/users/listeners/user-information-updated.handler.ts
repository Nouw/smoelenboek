import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { UpdateUserInformationInput } from '@repo/api';
import { EmailOutboxRepository } from '../../email/email-outbox.repository';
import { UsersRepository } from '../repositories/users.repository';
import { UserInformationUpdatedEvent } from '../events/user-information-updated.event';

const ADDRESS_KEYS: Array<keyof UpdateUserInformationInput> = ['houseNumber', 'streetName', 'postcode', 'city'];

@EventsHandler(UserInformationUpdatedEvent)
@Injectable()
export class UserInformationUpdatedHandler implements IEventHandler<UserInformationUpdatedEvent> {
  private readonly logger = new Logger(UserInformationUpdatedHandler.name);

  constructor(
    private readonly outbox: EmailOutboxRepository,
    private readonly userRepository: UsersRepository,
  ) {}

  async handle(event: UserInformationUpdatedEvent): Promise<void> {
    const user = await this.userRepository.findById(event.payload.userId);

    if (!user) {
      throw new NotFoundException(`Could not find user for id: ${event.payload.userId}`);
    }

    if (!user.email) return;

    const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    const changes = event.payload.changes;

    if (ADDRESS_KEYS.some((key) => key in changes)) {
      const newAddress = [
        changes.streetName,
        changes.houseNumber,
        changes.postcode,
        changes.city,
      ].filter((part): part is string => typeof part === 'string' && part.length > 0).join(', ');

      await this.outbox.enqueue({
        messageType: 'address_update',
        recipient: user.email,
        locale: user.preferredLocale,
        name,
        newAddress,
        relatedUserId: user.id,
        deduplicationKey: `address_update:${user.id}:${randomUUID()}`,
      });

      this.logger.log(JSON.stringify({ event: 'email.address_update_queued', userId: user.id }));
    }

    if (changes.bankAccountNumber !== undefined) {
      // TODO: send bank account change notification to penningmeester once role-based email lookup is available
    }
  }
}
