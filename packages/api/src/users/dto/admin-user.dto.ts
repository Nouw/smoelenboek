import { z } from 'zod';

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((value) => value || null).nullable().optional();

export const preferredLocaleSchema = z.enum(['nl', 'en']);

export const createManagedUserSchema = z
  .object({
    email: z.email().transform((value) => value.trim().toLowerCase()),
    name: optionalText(200),
    firstName: optionalText(100),
    lastName: optionalText(100),
    preferredLocale: preferredLocaleSchema.default('nl'),
    streetName: optionalText(128),
    houseNumber: optionalText(32),
    postcode: optionalText(16),
    city: optionalText(128),
    phoneNumber: optionalText(32),
    bankAccountNumber: optionalText(64),
    birthDate: z.iso.date().nullable().optional(),
    bondNumber: optionalText(32).transform((value) => value === '-' ? null : value),
    leaveDate: z.iso.date().nullable().optional(),
    backNumber: z.number().int().min(0).max(32767).nullable().optional(),
    refereeLicense: optionalText(64),
  })
  .refine(
    ({ name, firstName, lastName }) => Boolean(name || firstName || lastName),
    { message: 'A name, first name, or last name is required.', path: ['name'] },
  )
  .strict();

export type CreateManagedUserInput = z.infer<typeof createManagedUserSchema>;

export type ManagedUserDto = {
  id: string;
  email: string;
  name: string;
  preferredLocale: 'nl' | 'en';
  invitedAt: string | null;
  accountActivatedAt: string | null;
  invitationStatus: 'pending' | 'sending' | 'sent' | 'failed' | 'active' | 'not_queued';
};
