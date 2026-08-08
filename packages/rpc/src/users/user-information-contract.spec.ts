import { updateUserInformationSchema } from '@repo/api';
import { describe, expect, it } from '@jest/globals';

describe('updateUserInformationSchema', () => {
  it('accepts partial nullable information and trims text', () => {
    expect(
      updateUserInformationSchema.parse({
        streetName: '  Example street  ',
        leaveDate: null,
        backNumber: 8,
      }),
    ).toEqual({
      streetName: 'Example street',
      leaveDate: null,
      backNumber: 8,
    });
  });

  it('rejects empty updates, invalid dates, and negative back numbers', () => {
    expect(updateUserInformationSchema.safeParse({}).success).toBe(false);
    expect(
      updateUserInformationSchema.safeParse({ birthDate: '2002-02-30' })
        .success,
    ).toBe(false);
    expect(
      updateUserInformationSchema.safeParse({ backNumber: -1 }).success,
    ).toBe(false);
  });

  it('rejects contradictory membership dates supplied together', () => {
    const result = updateUserInformationSchema.safeParse({
      joinDate: '2025-09-01',
      leaveDate: '2025-08-31',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a separate join date because membership starts at user creation', () => {
    expect(
      updateUserInformationSchema.safeParse({ joinDate: '2025-09-01' })
        .success,
    ).toBe(false);
  });

  it('normalizes the legacy missing bond number marker to null', () => {
    expect(updateUserInformationSchema.parse({ bondNumber: ' - ' })).toEqual({
      bondNumber: null,
    });
  });
});
