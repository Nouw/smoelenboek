import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from '@jest/globals';
import { mapRows, suggestMapping } from './user-import.service';

describe('user spreadsheet mapping', () => {
  it('suggests Dutch and English aliases deterministically', () => {
    expect(suggestMapping(['E-mailadres', 'Voornaam', 'Last name', 'Taal', 'Rugnummer'])).toEqual({
      'E-mailadres': 'email', Voornaam: 'firstName', 'Last name': 'lastName', Taal: 'preferredLocale', Rugnummer: 'backNumber',
    });
  });

  it('never maps a spreadsheet column to a separate join date', () => {
    expect(suggestMapping(['Email', 'Voornaam', 'Lid sinds'])).toEqual({
      Email: 'email',
      Voornaam: 'firstName',
    });
  });

  it('normalizes locale and supported dates and reports invalid rows', () => {
    const rows = mapRows(['Email', 'Naam', 'Taal', 'Geboortedatum'], [
      ['MEMBER@EXAMPLE.COM', 'Member', 'Engels', '07-08-2000'],
      ['broken', '', 'nl', '01/02/2000'],
    ], 1, { Email: 'email', Naam: 'name', Taal: 'preferredLocale', Geboortedatum: 'birthDate' });
    expect(rows[0]?.input).toMatchObject({ email: 'member@example.com', preferredLocale: 'en', birthDate: '2000-08-07' });
    expect(rows[1]?.errors.length).toBeGreaterThan(0);
  });

  it('rejects ambiguous mappings', () => {
    expect(() => mapRows(['A', 'B'], [], 1, { A: 'email', B: 'email' })).toThrow(BadRequestException);
  });
});
