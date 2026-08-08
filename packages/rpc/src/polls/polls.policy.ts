import type { PollChoiceMode, PollStatus } from '@repo/api';

export type PollState = {
  opensAt: Date;
  closesAt: Date;
  publishedAt: Date | null;
  archivedAt: Date | null;
};

export function pollStatus(poll: PollState, now = new Date()): PollStatus {
  if (poll.archivedAt) return 'archived';
  if (!poll.publishedAt) return 'draft';
  if (now < poll.opensAt) return 'scheduled';
  if (now >= poll.closesAt) return 'closed';
  return 'open';
}

export function validateSelection(
  choiceMode: PollChoiceMode,
  optionIds: string[],
  validOptionIds: string[],
): boolean {
  const unique = new Set(optionIds);
  return (
    unique.size === optionIds.length &&
    (choiceMode === 'single_choice'
      ? optionIds.length === 1
      : optionIds.length > 0) &&
    optionIds.every((optionId) => validOptionIds.includes(optionId))
  );
}
