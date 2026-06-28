import { describe, expect, it } from '@jest/globals';

import { TEAM_NAMES, TEAM_ROLES } from './team-catalog';

describe('team catalog', () => {
  it('contains the seeded teams exactly once', () => {
    expect(TEAM_NAMES).toHaveLength(18);
    expect(new Set(TEAM_NAMES).size).toBe(18);
    expect(TEAM_NAMES).toContain('Heren 1');
    expect(TEAM_NAMES).toContain('Dames 11');
  });

  it('contains the strict team roles', () => {
    expect(TEAM_ROLES).toEqual([
      'libero',
      'middle',
      'coach_trainer',
      'setter',
      'outside_hitter',
      'opposite_hitter',
    ]);
  });
});

