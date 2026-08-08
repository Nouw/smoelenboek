import { describe, expect, it, jest } from '@jest/globals';

import {
  PollResponseSubmittedEvent,
  PollUpdatedEvent,
} from '../events/poll.events';
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
    const existingResponse = { id: '55555555-5555-4555-8555-555555555555' };
    const repository = repo();
    repository.findResponse.mockResolvedValue(existingResponse);
    const appendPreparedAndPublish = jest.fn(
      async (prepare: (manager: unknown) => Promise<PollResponseSubmittedEvent>) => {
        await prepare({});
      },
    );
    const handler = new SubmitPollVoteHandler(
      { appendPreparedAndPublish } as never,
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
    expect(repository.findPoll).toHaveBeenCalledWith(pollId);
    expect(appendPreparedAndPublish).toHaveBeenCalledWith(expect.any(Function));
    const [prepare] = (
      appendPreparedAndPublish as jest.MockedFunction<typeof appendPreparedAndPublish>
    ).mock.calls[0] as [(m: unknown) => Promise<PollResponseSubmittedEvent>];
    const event = await prepare({});
    expect(event).toBeInstanceOf(PollResponseSubmittedEvent);
    expect(event.toRecord()).toMatchObject({
      payload: expect.objectContaining({
        responseId: existingResponse.id,
        optionIds: [options[1]!.id],
      }),
    });
  });

  it('rejects a ballot at the exact closing boundary after acquiring the lock', async () => {
    const repository = repo({ closesAt: new Date('2026-08-08T10:00:00Z') });
    const appendPreparedAndPublish = jest.fn(
      async (prepare: (manager: unknown) => Promise<unknown>) => { await prepare({}); },
    );
    const handler = new SubmitPollVoteHandler(
      { appendPreparedAndPublish } as never,
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
    const appendPreparedAndPublish = jest.fn(
      async (prepare: (manager: unknown) => Promise<unknown>) => { await prepare({}); },
    );
    const handler = new UpdatePollHandler(
      { appendPreparedAndPublish } as never,
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

  it('preserves existing option ids when ballot fields are stable', async () => {
    const repository = repo();
    repository.countResponses.mockResolvedValue(1);
    const capturedEvents: PollUpdatedEvent[] = [];
    const appendPreparedAndPublish = jest.fn(
      async (prepare: (manager: unknown) => Promise<PollUpdatedEvent>) => {
        capturedEvents.push(await prepare({}));
      },
    );
    const handler = new UpdatePollHandler(
      { appendPreparedAndPublish } as never,
      repository as never,
    );
    await handler.execute(
      new UpdatePollCommand(
        userId,
        pollId,
        'Question?',
        'single_choice',
        new Date('2026-08-08T09:00:00Z'),
        new Date('2026-08-08T12:00:00Z'),
        ['A', 'B'],
      ),
    );
    expect(capturedEvents[0]).toBeInstanceOf(PollUpdatedEvent);
    const record = capturedEvents[0]!.toRecord();
    expect(record.payload.options.map(({ id }) => id)).toEqual(
      options.map(({ id }) => id),
    );
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
    findPoll: jest.fn().mockResolvedValue({ ...poll, options }),
    listOptions: jest.fn().mockResolvedValue(options),
    findResponse: jest.fn().mockResolvedValue(null),
    countResponses: jest.fn().mockResolvedValue(0),
  };
}
