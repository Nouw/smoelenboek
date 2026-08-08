import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { PollChoiceMode } from '@repo/api';

import { EventStorePublisher } from '../../event-store/event-store.publisher';
import { PollEntity } from '../entities/poll.entity';
import {
  PollArchivedEvent,
  PollCreatedEvent,
  PollDraftDeletedEvent,
  PollPublishedEvent,
  PollResponseSubmittedEvent,
  PollUpdatedEvent,
  type PollSnapshotPayload,
} from '../events/poll.events';
import { validateSelection } from '../polls.policy';
import { PollsRepository } from '../repositories/polls.repository';
import {
  ArchivePollCommand,
  CreatePollCommand,
  DeleteDraftPollCommand,
  PublishPollCommand,
  SubmitPollVoteCommand,
  UpdatePollCommand,
} from './poll.commands';

@CommandHandler(CreatePollCommand)
export class CreatePollHandler
  implements ICommandHandler<CreatePollCommand, PollEntity>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly repository: PollsRepository,
  ) {}

  async execute(command: CreatePollCommand): Promise<PollEntity> {
    const pollId = randomUUID();
    const payload = snapshot(command, pollId, null, null);
    await this.eventStorePublisher.appendAndPublish(
      PollCreatedEvent.create(payload, command.actorId),
    );
    const poll = await this.repository.findPoll(pollId);
    if (!poll) throw new Error('Poll projection missing after dispatch.');
    return poll;
  }
}

@CommandHandler(UpdatePollCommand)
export class UpdatePollHandler
  implements ICommandHandler<UpdatePollCommand, PollEntity>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly repository: PollsRepository,
  ) {}

  async execute(command: UpdatePollCommand): Promise<PollEntity> {
    await this.eventStorePublisher.appendPreparedAndPublish(async (manager) => {
      const poll = await this.repository.findPollForUpdate(command.pollId, manager);
      if (!poll) throw new NotFoundException('Poll not found.');
      if (poll.archivedAt)
        throw new ForbiddenException('Archived polls cannot be edited.');
      const options = await this.repository.listOptions(poll.id, manager);
      const responseCount = await this.repository.countResponses(poll.id, manager);
      if (responseCount > 0) {
        const ballotFieldsChanged =
          command.question !== poll.question ||
          command.choiceMode !== poll.choiceMode ||
          command.opensAt.getTime() !== poll.opensAt.getTime() ||
          command.options.length !== options.length ||
          command.options.some((label, index) => label !== options[index]?.label);
        if (ballotFieldsChanged) {
          throw new ConflictException(
            'Question, mode, options, and opening time are locked after the first ballot.',
          );
        }
        if (command.closesAt < poll.closesAt) {
          throw new ConflictException(
            'The closing time may only be extended after the first ballot.',
          );
        }
      }
      const payload = snapshot(
        command,
        poll.id,
        poll.publishedAt,
        poll.archivedAt,
        responseCount > 0 ? options.map((option) => option.id) : undefined,
      );
      return PollUpdatedEvent.create(payload, command.actorId);
    });
    const poll = await this.repository.findPoll(command.pollId);
    if (!poll) throw new Error('Poll projection missing after dispatch.');
    return poll;
  }
}

@CommandHandler(PublishPollCommand)
export class PublishPollHandler
  implements ICommandHandler<PublishPollCommand, PollEntity>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly repository: PollsRepository,
  ) {}

  async execute(command: PublishPollCommand): Promise<PollEntity> {
    await this.eventStorePublisher.appendPreparedAndPublish(async (manager) => {
      const poll = await this.repository.findPollForUpdate(command.pollId, manager);
      if (!poll) throw new NotFoundException('Poll not found.');
      if (poll.archivedAt)
        throw new ForbiddenException('Archived polls cannot be published.');
      if (poll.closesAt <= command.now)
        throw new BadRequestException('A poll cannot be published after closing.');
      const options = await this.repository.listOptions(poll.id, manager);
      if (options.length < 2)
        throw new BadRequestException('A poll requires at least two options.');
      return PollPublishedEvent.create(
        entitySnapshot(poll, options, poll.publishedAt ?? command.now, null),
        command.actorId,
      );
    });
    const poll = await this.repository.findPoll(command.pollId);
    if (!poll) throw new Error('Poll projection missing after dispatch.');
    return poll;
  }
}

@CommandHandler(ArchivePollCommand)
export class ArchivePollHandler
  implements ICommandHandler<ArchivePollCommand, PollEntity>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly repository: PollsRepository,
  ) {}

  async execute(command: ArchivePollCommand): Promise<PollEntity> {
    await this.eventStorePublisher.appendPreparedAndPublish(async (manager) => {
      const poll = await this.repository.findPollForUpdate(command.pollId, manager);
      if (!poll) throw new NotFoundException('Poll not found.');
      if (!poll.publishedAt)
        throw new BadRequestException('Delete an unpublished draft instead.');
      const options = await this.repository.listOptions(poll.id, manager);
      return PollArchivedEvent.create(
        entitySnapshot(poll, options, poll.publishedAt, poll.archivedAt ?? command.now),
        command.actorId,
      );
    });
    const poll = await this.repository.findPoll(command.pollId);
    if (!poll) throw new Error('Poll projection missing after dispatch.');
    return poll;
  }
}

@CommandHandler(DeleteDraftPollCommand)
export class DeleteDraftPollHandler
  implements ICommandHandler<DeleteDraftPollCommand, string>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly repository: PollsRepository,
  ) {}

  async execute(command: DeleteDraftPollCommand): Promise<string> {
    await this.eventStorePublisher.appendPreparedAndPublish(async (manager) => {
      const poll = await this.repository.findPollForUpdate(command.pollId, manager);
      if (!poll) throw new NotFoundException('Poll not found.');
      if (poll.publishedAt)
        throw new ForbiddenException('Published polls must be archived.');
      return PollDraftDeletedEvent.create(poll.id, command.actorId);
    });
    return command.pollId;
  }
}

@CommandHandler(SubmitPollVoteCommand)
export class SubmitPollVoteHandler
  implements ICommandHandler<SubmitPollVoteCommand, PollEntity>
{
  constructor(
    private readonly eventStorePublisher: EventStorePublisher,
    private readonly repository: PollsRepository,
  ) {}

  async execute(command: SubmitPollVoteCommand): Promise<PollEntity> {
    await this.eventStorePublisher.appendPreparedAndPublish(async (manager) => {
      const poll = await this.repository.findPollForUpdate(command.pollId, manager);
      if (!poll) throw new NotFoundException('Poll not found.');
      if (
        !poll.publishedAt ||
        poll.archivedAt ||
        command.now < poll.opensAt ||
        command.now >= poll.closesAt
      ) {
        throw new ForbiddenException('This poll is not open for voting.');
      }
      const options = await this.repository.listOptions(poll.id, manager);
      if (
        !validateSelection(
          poll.choiceMode,
          command.optionIds,
          options.map(({ id }) => id),
        )
      ) {
        throw new BadRequestException('The selected options are invalid for this poll.');
      }
      const existing = await this.repository.findResponse(poll.id, command.userId, manager);
      return PollResponseSubmittedEvent.create({
        responseId: existing?.id ?? randomUUID(),
        pollId: poll.id,
        userId: command.userId,
        optionIds: command.optionIds,
      });
    });
    const poll = await this.repository.findPoll(command.pollId);
    if (!poll) throw new Error('Poll projection missing after dispatch.');
    return poll;
  }
}

type PollFields = {
  question: string;
  choiceMode: PollChoiceMode;
  opensAt: Date;
  closesAt: Date;
  options: string[];
};

function snapshot(
  fields: PollFields,
  pollId: string,
  publishedAt: Date | null,
  archivedAt: Date | null,
  optionIds?: string[],
): PollSnapshotPayload {
  return {
    pollId,
    question: fields.question,
    choiceMode: fields.choiceMode,
    opensAt: fields.opensAt.toISOString(),
    closesAt: fields.closesAt.toISOString(),
    publishedAt: publishedAt?.toISOString() ?? null,
    archivedAt: archivedAt?.toISOString() ?? null,
    options: fields.options.map((label, position) => ({
      id: optionIds?.[position] ?? randomUUID(),
      label,
      position,
    })),
  };
}

function entitySnapshot(
  poll: PollEntity,
  options: Array<{ id: string; label: string; position: number }>,
  publishedAt: Date | null,
  archivedAt: Date | null,
): PollSnapshotPayload {
  return {
    pollId: poll.id,
    question: poll.question,
    choiceMode: poll.choiceMode,
    opensAt: poll.opensAt.toISOString(),
    closesAt: poll.closesAt.toISOString(),
    publishedAt: publishedAt?.toISOString() ?? null,
    archivedAt: archivedAt?.toISOString() ?? null,
    options: options.map(({ id, label, position }) => ({ id, label, position })),
  };
}
