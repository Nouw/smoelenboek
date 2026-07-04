import { z } from 'zod';

export const updateUserProfileSchema = z.object({
  imageUrl: z.string().url().nullable(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
