import { describe, expect, it, jest } from '@jest/globals';

import {
  PollArchivedEvent,
  PollCreatedEvent,
  PollDraftDeletedEvent,
  PollResponseSubmittedEvent,
} from '../events/poll.events';
import { PollsProjector } from './polls.projector';

const pollId = '11111111-1111-4111-8111-111111111111';

describe('PollsProjector', () => {
  it('routes handle() to projectPoll for snapshot events', async () => {
    const projector = makeProjector();
    jest.spyOn(projector, 'projectPoll').mockResolvedValue({} as never);
    const event = PollCreatedEvent.create(
      {
        pollId,
        question: 'Question?',
        choiceMode: 'single_choice',
        opensAt: new Date().toISOString(),
        closesAt: new Date().toISOString(),
        publishedAt: null,
        archivedAt: null,
        options: [],
      },
      'actor',
    );
    await projector.handle(event);
    expect(projector.projectPoll).toHaveBeenCalledWith(event.payload, expect.anything());
  });

  it('routes handle() to deletePoll for PollDraftDeletedEvent', async () => {
    const projector = makeProjector();
    jest.spyOn(projector, 'deletePoll').mockResolvedValue(pollId);
    const event = PollDraftDeletedEvent.create(pollId, 'actor');
    await projector.handle(event);
    expect(projector.deletePoll).toHaveBeenCalledWith(pollId, expect.anything());
  });

  it('routes handle() to projectResponse for PollResponseSubmittedEvent', async () => {
    const projector = makeProjector();
    jest.spyOn(projector, 'projectResponse').mockResolvedValue({} as never);
    const event = PollResponseSubmittedEvent.create({
      responseId: 'resp-1',
      pollId,
      userId: 'user-1',
      optionIds: ['opt-1'],
    });
    await projector.handle(event);
    expect(projector.projectResponse).toHaveBeenCalledWith(event.payload, expect.anything());
  });

  it('routes handle() to projectPoll for PollArchivedEvent', async () => {
    const projector = makeProjector();
    jest.spyOn(projector, 'projectPoll').mockResolvedValue({} as never);
    const event = PollArchivedEvent.create(
      {
        pollId,
        question: 'Q',
        choiceMode: 'single_choice',
        opensAt: new Date().toISOString(),
        closesAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
        archivedAt: new Date().toISOString(),
        options: [],
      },
      'actor',
    );
    await projector.handle(event);
    expect(projector.projectPoll).toHaveBeenCalled();
  });

  it('updates stable options in place so a closing-time extension preserves selections', async () => {
    const poll = {
      id: pollId,
      question: 'Question?',
      choiceMode: 'single_choice',
      opensAt: new Date('2026-08-08T09:00:00Z'),
      closesAt: new Date('2026-08-08T10:00:00Z'),
      publishedAt: new Date('2026-08-01T00:00:00Z'),
      archivedAt: null,
    };
    const stableOptions = [
      { id: '22222222-2222-4222-8222-222222222222', pollId: poll.id, label: 'A', position: 0 },
      { id: '33333333-3333-4333-8333-333333333333', pollId: poll.id, label: 'B', position: 1 },
    ];
    const polls = {
      findOne: jest.fn().mockResolvedValue(poll),
      create: jest.fn(),
      save: jest.fn().mockResolvedValue(poll),
    };
    const options = {
      findBy: jest.fn().mockResolvedValue(stableOptions),
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue(stableOptions),
      find: jest.fn().mockResolvedValue(stableOptions),
    };
    const manager = {
      getRepository: jest.fn((entity: { name: string }) =>
        entity.name === 'PollEntity' ? polls : options,
      ),
    };
    await new PollsProjector({} as never).projectPoll(
      {
        pollId: poll.id,
        question: poll.question,
        choiceMode: 'single_choice',
        opensAt: poll.opensAt.toISOString(),
        closesAt: '2026-08-08T11:00:00.000Z',
        publishedAt: poll.publishedAt.toISOString(),
        archivedAt: null,
        options: stableOptions.map(({ id, label, position }) => ({ id, label, position })),
      },
      manager as never,
    );
    expect(options.delete).not.toHaveBeenCalled();
    expect(options.save).toHaveBeenCalled();
  });

  it('projectPoll is idempotent on duplicate handle()', async () => {
    const projector = makeProjector();
    jest.spyOn(projector, 'projectPoll').mockResolvedValue({} as never);
    const event = PollCreatedEvent.create(
      {
        pollId,
        question: 'Q',
        choiceMode: 'single_choice',
        opensAt: new Date().toISOString(),
        closesAt: new Date().toISOString(),
        publishedAt: null,
        archivedAt: null,
        options: [],
      },
      'actor',
    );
    await projector.handle(event);
    await projector.handle(event);
    expect(projector.projectPoll).toHaveBeenCalledTimes(2);
  });
});

function makeProjector() {
  const manager = { getRepository: jest.fn() };
  const dataSource = {
    transaction: jest.fn(
      async (cb: (m: unknown) => Promise<unknown>) => cb(manager),
    ),
  };
  return new PollsProjector(dataSource as never);
}
