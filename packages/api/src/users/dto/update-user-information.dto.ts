import { z } from 'zod';

const optionalText = (maximumLength: number) =>
  z.string().trim().min(1).max(maximumLength).nullable().optional();

const optionalBondNumber = optionalText(32).transform((value) =>
  value === '-' ? null : value,
);

export const updateUserInformationSchema = z
  .object({
    streetName: optionalText(128),
    houseNumber: optionalText(32),
    postcode: optionalText(16),
    city: optionalText(128),
    phoneNumber: optionalText(32),
    bankAccountNumber: optionalText(64),
    birthDate: z.iso.date().nullable().optional(),
    bondNumber: optionalBondNumber,
    leaveDate: z.iso.date().nullable().optional(),
    backNumber: z.number().int().min(0).max(32767).nullable().optional(),
    refereeLicense: optionalText(64),
  })
  .strict()
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    'At least one user information field must be provided.',
  );

export type UpdateUserInformationInput = z.infer<
  typeof updateUserInformationSchema
>;
