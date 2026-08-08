import type { PollAdminResultDto, PollDto } from '@repo/api';

import { pollStatus } from '../polls.policy';

type PollRecord = {
  id: string;
  question: string;
  choiceMode: 'single_choice' | 'multiple_choice';
  opensAt: Date;
  closesAt: Date;
  publishedAt: Date | null;
  archivedAt: Date | null;
  options: Array<{ id: string; label: string; position: number }>;
};

type PollResponseRecord = {
  user: {
    id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  selections: Array<{ optionId: string }>;
  submittedAt: Date;
  updatedAt: Date;
};

export function toPollOutput(
  poll: PollRecord,
  selectedOptionIds: string[] = [],
  now = new Date(),
): PollDto {
  return {
    id: poll.id,
    question: poll.question,
    choiceMode: poll.choiceMode,
    opensAt: poll.opensAt.toISOString(),
    closesAt: poll.closesAt.toISOString(),
    publishedAt: poll.publishedAt?.toISOString() ?? null,
    archivedAt: poll.archivedAt?.toISOString() ?? null,
    status: pollStatus(poll, now),
    options: poll.options.map((option) => ({
      id: option.id,
      label: option.label,
      position: option.position,
    })),
    selectedOptionIds,
  };
}

export function toAdminResultOutput(
  poll: PollRecord,
  responses: PollResponseRecord[],
  now = new Date(),
): PollAdminResultDto {
  const counts = new Map(poll.options.map((option) => [option.id, 0]));
  for (const response of responses) {
    for (const selection of response.selections) {
      counts.set(selection.optionId, (counts.get(selection.optionId) ?? 0) + 1);
    }
  }
  return {
    poll: toPollOutput(poll, [], now),
    ballotCount: responses.length,
    options: poll.options.map((option) => {
      const count = counts.get(option.id) ?? 0;
      return {
        id: option.id,
        label: option.label,
        position: option.position,
        count,
        percentage:
          responses.length === 0
            ? 0
            : Math.round((count / responses.length) * 1000) / 10,
      };
    }),
    voters: responses.map((response) => ({
      user: {
        id: response.user.id,
        name:
          [response.user.firstName, response.user.lastName]
            .filter(Boolean)
            .join(' ') ||
          response.user.name ||
          response.user.email ||
          'Member',
        email: response.user.email,
      },
      optionIds: response.selections.map((selection) => selection.optionId),
      submittedAt: response.submittedAt.toISOString(),
      updatedAt: response.updatedAt.toISOString(),
    })),
  };
}
