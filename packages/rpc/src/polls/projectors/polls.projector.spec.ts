import { describe, expect, it, jest } from '@jest/globals';

import { PollsProjector } from './polls.projector';

describe('PollsProjector', () => {
  it('updates stable options in place so a closing-time extension preserves selections', async () => {
    const poll = {
      id: '11111111-1111-4111-8111-111111111111',
      question: 'Question?',
      choiceMode: 'single_choice',
      opensAt: new Date('2026-08-08T09:00:00Z'),
      closesAt: new Date('2026-08-08T10:00:00Z'),
      publishedAt: new Date('2026-08-01T00:00:00Z'),
      archivedAt: null,
    };
    const stableOptions = [
      {
        id: '22222222-2222-4222-8222-222222222222',
        pollId: poll.id,
        label: 'A',
        position: 0,
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        pollId: poll.id,
        label: 'B',
        position: 1,
      },
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
    await new PollsProjector().projectPoll(
      {
        pollId: poll.id,
        question: poll.question,
        choiceMode: 'single_choice',
        opensAt: poll.opensAt.toISOString(),
        closesAt: '2026-08-08T11:00:00.000Z',
        publishedAt: poll.publishedAt.toISOString(),
        archivedAt: null,
        options: stableOptions.map(({ id, label, position }) => ({
          id,
          label,
          position,
        })),
      },
      manager as never,
    );
    expect(options.delete).not.toHaveBeenCalled();
    expect(options.save).toHaveBeenCalled();
  });
});
