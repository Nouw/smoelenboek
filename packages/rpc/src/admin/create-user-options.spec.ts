import { describe, expect, it } from '@jest/globals';

import { parseCreateUserArgs } from './create-user-options';

describe('parseCreateUserArgs', () => {
  it('parses and normalizes required create-user arguments', () => {
    expect(
      parseCreateUserArgs([
        '--',
        '--email',
        'USER@example.com',
        '--password',
        'password123',
        '--name',
        'Test User',
      ]),
    ).toEqual({
      email: 'user@example.com',
      password: 'password123',
      name: 'Test User',
    });
  });

  it('rejects missing required arguments', () => {
    expect(() =>
      parseCreateUserArgs(['--email', 'user@example.com']),
    ).toThrow('--password is required.');
  });

  it('rejects short passwords before calling Better Auth', () => {
    expect(() =>
      parseCreateUserArgs([
        '--email',
        'user@example.com',
        '--password',
        'short',
        '--name',
        'Test User',
      ]),
    ).toThrow('--password must be at least 8 characters.');
  });
});
