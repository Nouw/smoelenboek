import { describe, expect, it } from '@jest/globals';

import { COMMITTEE_NAMES, COMMITTEE_ROLES } from './committee-catalog';

describe('committee catalog', () => {
  it('contains the seeded committees exactly once', () => {
    expect(COMMITTEE_NAMES).toHaveLength(22);
    expect(new Set(COMMITTEE_NAMES).size).toBe(22);
    expect(COMMITTEE_NAMES).toContain('Bestuur');
    expect(COMMITTEE_NAMES).toContain('Inclusiviteitscommissie');
  });

  it('contains the strict committee roles', () => {
    expect(COMMITTEE_ROLES).toEqual([
      'commissielid',
      'commissaris_externe_zaken',
      'wedstrijdsecretaris',
      'penningmeester',
      'commissaris_zaalwacht_en_arbitrage',
      'voorzitter',
      'secretaris',
    ]);
  });
});

