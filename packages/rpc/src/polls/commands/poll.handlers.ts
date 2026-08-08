import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { PollChoiceMode } from '@repo/api';

import { EventStoreRepository } from '../../event-store/repositories/event-store.repository';
import { PollEntity } from '../entities/poll.entity';
import {
  pollDeletedEvent,
  pollEvent,
  pollResponseEvent,
  type PollSnapshotPayload,
} from '../events/poll.events';
import { validateSelection } from '../polls.policy';
import { PollsProjector } from '../projectors/polls.projector';
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
    private readonly events: EventStoreRepository,
    private readonly projector: PollsProjector,
  ) {}
  execute(command: CreatePollCommand): Promise<PollEntity> {
    const payload = snapshot(command, randomUUID(), null, null);
    return this.events.appendAndProject(
      pollEvent('poll.created', payload, command.actorId),
      (_stored, manager) => this.projector.projectPoll(payload, manager),
    );
  }
}

@CommandHandler(UpdatePollCommand)
export class UpdatePollHandler
  implements ICommandHandler<UpdatePollCommand, PollEntity>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: PollsProjector,
    private readonly repository: PollsRepository,
  ) {}
  execute(command: UpdatePollCommand): Promise<PollEntity> {
    return this.events.appendPreparedAndProject(
      async (manager) => {
        const poll = await this.repository.findPollForUpdate(
          command.pollId,
          manager,
        );
        if (!poll) throw new NotFoundException('Poll not found.');
        if (poll.archivedAt)
          throw new ForbiddenException('Archived polls cannot be edited.');
        const options = await this.repository.listOptions(poll.id, manager);
        const responseCount = await this.repository.countResponses(
          poll.id,
          manager,
        );
        if (responseCount > 0) {
          const ballotFieldsChanged =
            command.question !== poll.question ||
            command.choiceMode !== poll.choiceMode ||
            command.opensAt.getTime() !== poll.opensAt.getTime() ||
            command.options.length !== options.length ||
            command.options.some(
              (label, index) => label !== options[index]?.label,
            );
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
        return pollEvent('poll.updated', payload, command.actorId);
      },
      (event, _stored, manager) =>
        this.projector.projectPoll(event.payload, manager),
    );
  }
}

@CommandHandler(PublishPollCommand)
export class PublishPollHandler
  implements ICommandHandler<PublishPollCommand, PollEntity>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: PollsProjector,
    private readonly repository: PollsRepository,
  ) {}
  execute(command: PublishPollCommand): Promise<PollEntity> {
    return this.events.appendPreparedAndProject(
      async (manager) => {
        const poll = await this.repository.findPollForUpdate(
          command.pollId,
          manager,
        );
        if (!poll) throw new NotFoundException('Poll not found.');
        if (poll.archivedAt)
          throw new ForbiddenException('Archived polls cannot be published.');
        if (poll.closesAt <= command.now)
          throw new BadRequestException(
            'A poll cannot be published after closing.',
          );
        const options = await this.repository.listOptions(poll.id, manager);
        if (options.length < 2)
          throw new BadRequestException(
            'A poll requires at least two options.',
          );
        return pollEvent(
          'poll.published',
          entitySnapshot(poll, options, poll.publishedAt ?? command.now, null),
          command.actorId,
        );
      },
      (event, _stored, manager) =>
        this.projector.projectPoll(event.payload, manager),
    );
  }
}

@CommandHandler(ArchivePollCommand)
export class ArchivePollHandler
  implements ICommandHandler<ArchivePollCommand, PollEntity>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: PollsProjector,
    private readonly repository: PollsRepository,
  ) {}
  execute(command: ArchivePollCommand): Promise<PollEntity> {
    return this.events.appendPreparedAndProject(
      async (manager) => {
        const poll = await this.repository.findPollForUpdate(
          command.pollId,
          manager,
        );
        if (!poll) throw new NotFoundException('Poll not found.');
        if (!poll.publishedAt)
          throw new BadRequestException('Delete an unpublished draft instead.');
        const options = await this.repository.listOptions(poll.id, manager);
        return pollEvent(
          'poll.archived',
          entitySnapshot(
            poll,
            options,
            poll.publishedAt,
            poll.archivedAt ?? command.now,
          ),
          command.actorId,
        );
      },
      (event, _stored, manager) =>
        this.projector.projectPoll(event.payload, manager),
    );
  }
}

@CommandHandler(DeleteDraftPollCommand)
export class DeleteDraftPollHandler
  implements ICommandHandler<DeleteDraftPollCommand, string>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: PollsProjector,
    private readonly repository: PollsRepository,
  ) {}
  execute(command: DeleteDraftPollCommand): Promise<string> {
    return this.events.appendPreparedAndProject(
      async (manager) => {
        const poll = await this.repository.findPollForUpdate(
          command.pollId,
          manager,
        );
        if (!poll) throw new NotFoundException('Poll not found.');
        if (poll.publishedAt)
          throw new ForbiddenException('Published polls must be archived.');
        return pollDeletedEvent(poll.id, command.actorId);
      },
      (event, _stored, manager) =>
        this.projector.deletePoll(event.payload.pollId, manager),
    );
  }
}

@CommandHandler(SubmitPollVoteCommand)
export class SubmitPollVoteHandler
  implements ICommandHandler<SubmitPollVoteCommand, PollEntity>
{
  constructor(
    private readonly events: EventStoreRepository,
    private readonly projector: PollsProjector,
    private readonly repository: PollsRepository,
  ) {}
  execute(command: SubmitPollVoteCommand): Promise<PollEntity> {
    return this.events.appendPreparedAndProject(
      async (manager) => {
        const poll = await this.repository.findPollForUpdate(
          command.pollId,
          manager,
        );
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
          throw new BadRequestException(
            'The selected options are invalid for this poll.',
          );
        }
        const existing = await this.repository.findResponse(
          poll.id,
          command.userId,
          manager,
        );
        return pollResponseEvent({
          responseId: existing?.id ?? randomUUID(),
          pollId: poll.id,
          userId: command.userId,
          optionIds: command.optionIds,
        });
      },
      async (event, _stored, manager) => {
        await this.projector.projectResponse(event.payload, manager);
        const poll = await manager.getRepository(PollEntity).findOneOrFail({
          where: { id: event.payload.pollId },
          relations: { options: true },
          order: { options: { position: 'ASC' } },
        });
        return poll;
      },
    );
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
    options: options.map(({ id, label, position }) => ({
      id,
      label,
      position,
    })),
  };
}
