import { z } from 'zod';

export const protototoEmailInputSchema = z.string().trim().pipe(z.email());

export const matchFormatSchema = z.enum([
  'best_of_5',
  'four_sets',
  'four_plus_one',
]);
export type MatchFormat = z.infer<typeof matchFormatSchema>;

export const subjectSideSchema = z.enum(['home', 'away']);
export type SubjectSide = z.infer<typeof subjectSideSchema>;

export const protototoPredictionSchema = z.object({
  matchId: z.uuid(),
  setWinners: z.array(z.boolean()).min(3).max(5),
});
export type ProtototoPredictionDto = z.infer<typeof protototoPredictionSchema>;

export const protototoMatchSchema = z.object({
  id: z.uuid(),
  roundId: z.uuid(),
  nevoboMatchId: z.uuid(),
  selectedTeamIri: z.string().min(1),
  homeTeamName: z.string().min(1),
  awayTeamName: z.string().min(1),
  subjectSide: subjectSideSchema,
  format: matchFormatSchema,
  startsAt: z.iso.datetime(),
  resultStatus: z.enum(['pending', 'final', 'cancelled']).nullable(),
  resultSetWinners: z.array(z.boolean()).nullable(),
  resultSyncedAt: z.iso.datetime().nullable(),
  lastSyncAttemptAt: z.iso.datetime().nullable(),
  lastSyncError: z.string().nullable(),
  removedAt: z.iso.datetime().nullable(),
});
export type ProtototoMatchDto = z.infer<typeof protototoMatchSchema>;

export const protototoRoundStatusSchema = z.enum([
  'draft',
  'scheduled',
  'open',
  'closed',
  'archived',
]);
export const protototoRoundSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  opensAt: z.iso.datetime(),
  closesAt: z.iso.datetime(),
  tikkieUrl: z.url().nullable(),
  status: protototoRoundStatusSchema,
  publishedAt: z.iso.datetime().nullable(),
  archivedAt: z.iso.datetime().nullable(),
  matches: z.array(protototoMatchSchema),
});
export type ProtototoRoundDto = z.infer<typeof protototoRoundSchema>;

export const protototoEntrySchema = z.object({
  id: z.uuid(),
  roundId: z.uuid(),
  participantType: z.enum(['member', 'anonymous']),
  displayName: z.string().min(1),
  predictions: z.array(protototoPredictionSchema),
  submittedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type ProtototoEntryDto = z.infer<typeof protototoEntrySchema>;

export const protototoStandingSchema = z.object({
  rank: z.number().int().positive(),
  entryId: z.uuid(),
  displayName: z.string().min(1),
  participantType: z.enum(['member', 'anonymous']),
  totalPoints: z.number().int().nonnegative(),
  matchPoints: z.array(
    z.object({ matchId: z.uuid(), points: z.number().int().nonnegative() }),
  ),
});
export type ProtototoStandingDto = z.infer<typeof protototoStandingSchema>;

export const protototoAdminEntrySchema = protototoEntrySchema.extend({
  email: z.email().nullable(),
  paymentClaimed: z.boolean(),
  paymentClaimedAt: z.iso.datetime().nullable(),
  complete: z.boolean(),
  matchPoints: z.array(
    z.object({ matchId: z.uuid(), points: z.number().int().nonnegative() }),
  ),
  pointsByMatch: z.array(
    z.object({ matchId: z.uuid(), points: z.number().int().nonnegative() }),
  ),
  totalPoints: z.number().int().nonnegative(),
});
export type ProtototoAdminEntryDto = z.infer<typeof protototoAdminEntrySchema>;

export const nevoboTeamSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});
export type NevoboTeamSummaryDto = z.infer<typeof nevoboTeamSummarySchema>;

export const nevoboMatchSummarySchema = z.object({
  id: z.uuid(),
  homeTeamName: z.string().min(1),
  awayTeamName: z.string().min(1),
  startsAt: z.iso.datetime(),
});
export type NevoboMatchSummaryDto = z.infer<typeof nevoboMatchSummarySchema>;

export const protototoSyncResultSchema = z.object({
  final: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  cancelled: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
});
export type ProtototoSyncResultDto = z.infer<typeof protototoSyncResultSchema>;

export const createProtototoRoundInputSchema = z.object({
  title: z.string().trim().min(1).max(120),
  opensAt: z.iso.datetime(),
  closesAt: z.iso.datetime(),
  tikkieUrl: z.url().nullable().optional(),
});
export type CreateProtototoRoundInput = z.infer<
  typeof createProtototoRoundInputSchema
>;

export const updateProtototoRoundInputSchema =
  createProtototoRoundInputSchema.extend({ roundId: z.uuid() });
export type UpdateProtototoRoundInput = z.infer<
  typeof updateProtototoRoundInputSchema
>;

export const submitProtototoEntryInputSchema = z.object({
  roundId: z.uuid(),
  firstName: z.string().trim().min(1).max(100).optional(),
  email: protototoEmailInputSchema.optional(),
  paymentClaimed: z.boolean().optional(),
  predictions: z.array(protototoPredictionSchema).min(1),
});
export type SubmitProtototoEntryInput = z.infer<
  typeof submitProtototoEntryInputSchema
>;
