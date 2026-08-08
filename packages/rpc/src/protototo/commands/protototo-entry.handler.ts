import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { EntityManager } from 'typeorm';

import { EventStorePublisher } from '../../event-store/event-store.publisher';
import { UsersRepository } from '../../users/repositories/users.repository';
import { ProtototoEntryEntity } from '../entities/protototo-entry.entity';
import { ProtototoEntrySubmittedEvent } from '../events/protototo.events';
import {
  canonicalFirstName,
  isRoundOpen,
  isValidPrediction,
  normalizeEmail,
  normalizeFirstName,
} from '../protototo.policy';
import { ProtototoRepository } from '../repositories/protototo.repository';
import { SubmitProtototoEntryCommand } from './protototo.commands';

@CommandHandler(SubmitProtototoEntryCommand)
export class SubmitProtototoEntryHandler
  implements ICommandHandler<SubmitProtototoEntryCommand, ProtototoEntryEntity>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly repository: ProtototoRepository,
    private readonly users: UsersRepository,
  ) {}

  async execute(
    command: SubmitProtototoEntryCommand,
  ): Promise<ProtototoEntryEntity> {
    let entryId: string | null = null;

    await this.eventStorePublisher.appendPreparedAndPublish(async (manager) => {
      const round = await this.repository.findRoundForUpdate(
        command.roundId,
        manager,
      );
      if (!round) {
        throw new NotFoundException('Protototo round not found.');
      }
      if (!isRoundOpen(round, command.now)) {
        throw new ForbiddenException('Betting is not open for this round.');
      }
      const matches = await this.repository.findActiveMatches(
        round.id,
        manager,
      );
      validatePredictions(command, matches);

      const identity = command.actorUserId
        ? await this.memberIdentity(round.id, command.actorUserId, manager)
        : await this.anonymousIdentity(
            command,
            round.tikkieUrl !== null,
            manager,
          );
      const paymentClaimedAt =
        identity.existing?.paymentClaimedAt ??
        (identity.participantType === 'anonymous' && command.paymentClaimed
          ? command.now
          : null);
      const payload = {
        entryId: identity.existing?.id ?? randomUUID(),
        roundId: round.id,
        participantType: identity.participantType,
        userId: identity.userId,
        firstName: identity.firstName,
        email: identity.email,
        emailNormalized: identity.emailNormalized,
        firstNameNormalized: identity.firstNameNormalized,
        paymentClaimedAt: paymentClaimedAt?.toISOString() ?? null,
        predictions: command.predictions.map((prediction) => ({
          predictionId: randomUUID(),
          matchId: prediction.matchId,
          setWinners: prediction.setWinners,
        })),
      };
      entryId = payload.entryId;
      return ProtototoEntrySubmittedEvent.create(
        payload,
        identity.participantType,
        command.actorUserId ?? undefined,
      );
    });

    const entry = await this.repository.findEntry(entryId!);
    if (!entry) throw new Error('Entry projection missing after dispatch.');
    return entry;
  }

  private async memberIdentity(
    roundId: string,
    userId: string,
    manager: EntityManager,
  ) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new NotFoundException('Member profile not found.');
    }
    return {
      existing: await this.repository.findMemberEntry(roundId, userId, manager),
      participantType: 'member' as const,
      userId,
      firstName:
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.name ||
        'Member',
      email: null,
      emailNormalized: null,
      firstNameNormalized: null,
    };
  }

  private async anonymousIdentity(
    command: SubmitProtototoEntryCommand,
    paymentRequired: boolean,
    manager: EntityManager,
  ) {
    if (!command.firstName || !command.email) {
      throw new BadRequestException('First name and email are required.');
    }
    if (paymentRequired && !command.paymentClaimed) {
      throw new BadRequestException('Payment confirmation is required.');
    }
    const emailNormalized = normalizeEmail(command.email);
    const firstNameNormalized = normalizeFirstName(command.firstName);
    const existing = await this.repository.findAnonymousEntry(
      command.roundId,
      emailNormalized,
      manager,
    );
    if (existing && existing.firstNameNormalized !== firstNameNormalized) {
      throw new ForbiddenException('Anonymous entry details do not match.');
    }
    return {
      existing,
      participantType: 'anonymous' as const,
      userId: null,
      firstName: canonicalFirstName(command.firstName),
      email: emailNormalized,
      emailNormalized,
      firstNameNormalized,
    };
  }
}

function validatePredictions(
  command: SubmitProtototoEntryCommand,
  matches: Array<{
    id: string;
    format: 'best_of_5' | 'four_sets' | 'four_plus_one';
  }>,
): void {
  const byMatch = new Map(
    command.predictions.map((prediction) => [prediction.matchId, prediction]),
  );
  if (
    byMatch.size !== matches.length ||
    command.predictions.length !== matches.length ||
    matches.some((match) => !byMatch.has(match.id))
  ) {
    throw new BadRequestException(
      'Predictions must cover every active match exactly once.',
    );
  }
  for (const match of matches) {
    const prediction = byMatch.get(match.id);
    if (
      !prediction ||
      !isValidPrediction(match.format, prediction.setWinners)
    ) {
      throw new BadRequestException(
        `Prediction for match ${match.id} does not match its set format.`,
      );
    }
  }
}
