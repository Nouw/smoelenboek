import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

import { PollEntity } from '../entities/poll.entity';
import { PollOptionEntity } from '../entities/poll-option.entity';
import { PollResponseEntity } from '../entities/poll-response.entity';
import { PollSelectionEntity } from '../entities/poll-selection.entity';
import type {
  PollResponsePayload,
  PollSnapshotPayload,
} from '../events/poll.events';

@Injectable()
export class PollsProjector {
  async projectPoll(
    payload: PollSnapshotPayload,
    manager: EntityManager,
  ): Promise<PollEntity> {
    const polls = manager.getRepository(PollEntity);
    const options = manager.getRepository(PollOptionEntity);
    const entity =
      (await polls.findOne({
        where: { id: payload.pollId },
        lock: { mode: 'pessimistic_write' },
      })) ?? polls.create({ id: payload.pollId });
    Object.assign(entity, {
      question: payload.question,
      choiceMode: payload.choiceMode,
      opensAt: new Date(payload.opensAt),
      closesAt: new Date(payload.closesAt),
      publishedAt: payload.publishedAt ? new Date(payload.publishedAt) : null,
      archivedAt: payload.archivedAt ? new Date(payload.archivedAt) : null,
    });
    const saved = await polls.save(entity);
    const existingOptions = await options.findBy({ pollId: payload.pollId });
    const keepsOptionIdentity =
      existingOptions.length === payload.options.length &&
      existingOptions.every((option) =>
        payload.options.some(({ id }) => id === option.id),
      );
    if (!keepsOptionIdentity) {
      await options.delete({ pollId: payload.pollId });
    }
    await options.save(
      payload.options.map((option) =>
        options.create({ ...option, pollId: payload.pollId }),
      ),
    );
    saved.options = await options.find({
      where: { pollId: payload.pollId },
      order: { position: 'ASC' },
    });
    return saved;
  }

  async deletePoll(pollId: string, manager: EntityManager): Promise<string> {
    await manager.getRepository(PollEntity).delete(pollId);
    return pollId;
  }

  async projectResponse(
    payload: PollResponsePayload,
    manager: EntityManager,
  ): Promise<PollResponseEntity> {
    const responses = manager.getRepository(PollResponseEntity);
    const selections = manager.getRepository(PollSelectionEntity);
    const response =
      (await responses.findOneBy({ id: payload.responseId })) ??
      responses.create({ id: payload.responseId });
    Object.assign(response, { pollId: payload.pollId, userId: payload.userId });
    const saved = await responses.save(response);
    await selections.delete({ responseId: saved.id });
    await selections.save(
      payload.optionIds.map((optionId) =>
        selections.create({
          id: randomUUID(),
          responseId: saved.id,
          optionId,
        }),
      ),
    );
    saved.selections = await selections.findBy({ responseId: saved.id });
    return saved;
  }
}
