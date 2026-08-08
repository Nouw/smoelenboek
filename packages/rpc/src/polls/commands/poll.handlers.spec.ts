import { describe, expect, it, jest } from '@jest/globals';

import { SubmitPollVoteCommand, UpdatePollCommand } from './poll.commands';
import { SubmitPollVoteHandler, UpdatePollHandler } from './poll.handlers';

const pollId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';
const options = [
  { id: '33333333-3333-4333-8333-333333333333', label: 'A', position: 0 },
  { id: '44444444-4444-4444-8444-444444444444', label: 'B', position: 1 },
];

describe('poll command handlers', () => {
  it('locks the poll and replaces an existing ballot through the event transaction', async () => {
    const repository = repo();
    repository.findResponse.mockResolvedValue({
      id: '55555555-5555-4555-8555-555555555555',
    });
    const events = preparedEvents();
    const projector = { projectResponse: jest.fn().mockResolvedValue({}) };
    const handler = new SubmitPollVoteHandler(
      events as never,
      projector as never,
      repository as never,
    );
    await handler.execute(
      new SubmitPollVoteCommand(
        userId,
        pollId,
        [options[1]!.id],
        new Date('2026-08-08T10:00:00Z'),
      ),
    );
    expect(repository.findPollForUpdate).toHaveBeenCalled();
    expect(projector.projectResponse).toHaveBeenCalledWith(
      expect.objectContaining({ optionIds: [options[1]!.id] }),
      expect.anything(),
    );
  });

  it('rejects a ballot at the exact closing boundary after acquiring the lock', async () => {
    const repository = repo({ closesAt: new Date('2026-08-08T10:00:00Z') });
    const handler = new SubmitPollVoteHandler(
      preparedEvents() as never,
      {} as never,
      repository as never,
    );
    await expect(
      handler.execute(
        new SubmitPollVoteCommand(
          userId,
          pollId,
          [options[0]!.id],
          new Date('2026-08-08T10:00:00Z'),
        ),
      ),
    ).rejects.toThrow('not open');
  });

  it('locks ballot fields and permits only a closing-time extension after a response', async () => {
    const repository = repo();
    repository.countResponses.mockResolvedValue(1);
    const handler = new UpdatePollHandler(
      preparedEvents() as never,
      {} as never,
      repository as never,
    );
    await expect(
      handler.execute(
        new UpdatePollCommand(
          userId,
          pollId,
          'Changed',
          'single_choice',
          new Date('2026-08-08T09:00:00Z'),
          new Date('2026-08-08T12:00:00Z'),
          ['A', 'B'],
        ),
      ),
    ).rejects.toThrow('locked after the first ballot');
  });
});

function repo(overrides: Record<string, unknown> = {}) {
  const poll = {
    id: pollId,
    question: 'Question?',
    choiceMode: 'single_choice',
    opensAt: new Date('2026-08-08T09:00:00Z'),
    closesAt: new Date('2026-08-08T11:00:00Z'),
    publishedAt: new Date('2026-08-01T00:00:00Z'),
    archivedAt: null,
    ...overrides,
  };
  return {
    findPollForUpdate: jest.fn().mockResolvedValue(poll),
    listOptions: jest.fn().mockResolvedValue(options),
    findResponse: jest.fn().mockResolvedValue(null),
    countResponses: jest.fn().mockResolvedValue(0),
  };
}

function preparedEvents() {
  const manager = {
    getRepository: jest.fn().mockReturnValue({
      findOneOrFail: jest.fn().mockResolvedValue({ ...repo(), options }),
    }),
  };
  return {
    appendPreparedAndProject: jest.fn(
      async (prepare: never, project: never) => {
        const event = await (prepare as (manager: unknown) => Promise<unknown>)(
          manager,
        );
        return (
          project as (
            event: unknown,
            stored: unknown,
            manager: unknown,
          ) => Promise<unknown>
        )(event, {}, manager);
      },
    ),
  };
}
