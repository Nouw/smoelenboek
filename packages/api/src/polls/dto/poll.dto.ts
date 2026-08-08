import { z } from 'zod';

export const pollChoiceModeSchema = z.enum([
  'single_choice',
  'multiple_choice',
]);
export type PollChoiceMode = z.infer<typeof pollChoiceModeSchema>;

export const pollStatusSchema = z.enum([
  'draft',
  'scheduled',
  'open',
  'closed',
  'archived',
]);
export type PollStatus = z.infer<typeof pollStatusSchema>;

export const pollOptionSchema = z.object({
  id: z.uuid(),
  label: z.string().min(1).max(200),
  position: z.number().int().nonnegative(),
});
export type PollOptionDto = z.infer<typeof pollOptionSchema>;

export const pollSchema = z.object({
  id: z.uuid(),
  question: z.string().min(1).max(500),
  choiceMode: pollChoiceModeSchema,
  opensAt: z.iso.datetime(),
  closesAt: z.iso.datetime(),
  publishedAt: z.iso.datetime().nullable(),
  archivedAt: z.iso.datetime().nullable(),
  status: pollStatusSchema,
  options: z.array(pollOptionSchema).min(2).max(20),
  selectedOptionIds: z.array(z.uuid()),
});
export type PollDto = z.infer<typeof pollSchema>;

const pollFieldsSchema = z
  .object({
    question: z.string().trim().min(1).max(500),
    choiceMode: pollChoiceModeSchema,
    opensAt: z.iso.datetime(),
    closesAt: z.iso.datetime(),
    options: z.array(z.string().trim().min(1).max(200)).min(2).max(20),
  })
  .superRefine((value, context) => {
    if (new Date(value.opensAt) >= new Date(value.closesAt)) {
      context.addIssue({
        code: 'custom',
        path: ['closesAt'],
        message: 'Closing time must be later than opening time.',
      });
    }
    const normalized = value.options.map((option) =>
      option.toLocaleLowerCase(),
    );
    if (new Set(normalized).size !== normalized.length) {
      context.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Poll options must be distinct.',
      });
    }
  });

export const createPollInputSchema = pollFieldsSchema;
export type CreatePollInput = z.infer<typeof createPollInputSchema>;

export const updatePollInputSchema = pollFieldsSchema.safeExtend({
  pollId: z.uuid(),
});
export type UpdatePollInput = z.infer<typeof updatePollInputSchema>;

export const submitPollVoteInputSchema = z.object({
  pollId: z.uuid(),
  optionIds: z.array(z.uuid()).min(1).max(20),
});
export type SubmitPollVoteInput = z.infer<typeof submitPollVoteInputSchema>;

export const pollAdminResultSchema = z.object({
  poll: pollSchema,
  ballotCount: z.number().int().nonnegative(),
  options: z.array(
    pollOptionSchema.extend({
      count: z.number().int().nonnegative(),
      percentage: z.number().min(0).max(100),
    }),
  ),
  voters: z.array(
    z.object({
      user: z.object({
        id: z.uuid(),
        name: z.string().min(1),
        email: z.string().nullable(),
      }),
      optionIds: z.array(z.uuid()),
      submittedAt: z.iso.datetime(),
      updatedAt: z.iso.datetime(),
    }),
  ),
});
export type PollAdminResultDto = z.infer<typeof pollAdminResultSchema>;
