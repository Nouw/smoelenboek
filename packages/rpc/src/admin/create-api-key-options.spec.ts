import { describe, expect, it } from '@jest/globals';

import { parseCreateApiKeyArgs } from './create-api-key-options';

describe('parseCreateApiKeyArgs', () => {
  it('parses an email based API key request', () => {
    expect(
      parseCreateApiKeyArgs([
        '--',
        '--email',
        'USER@example.com',
        '--name',
        'Local docs',
        '--prefix',
        'sml',
        '--expires-in',
        '3600',
        '--metadata',
        '{"source":"cli"}',
        '--rate-limit-enabled',
        'false',
      ]),
    ).toEqual({
      email: 'user@example.com',
      name: 'Local docs',
      prefix: 'sml',
      expiresIn: 3600,
      metadata: { source: 'cli' },
      rateLimitEnabled: false,
    });
  });

  it('parses a user id based API key request', () => {
    expect(
      parseCreateApiKeyArgs(['--user-id', 'user_123', '--remaining', '10']),
    ).toEqual({
      userId: 'user_123',
      remaining: 10,
    });
  });

  it('requires exactly one user selector', () => {
    expect(() => parseCreateApiKeyArgs([])).toThrow(
      'Either --email or --user-id is required.',
    );
    expect(() =>
      parseCreateApiKeyArgs([
        '--email',
        'user@example.com',
        '--user-id',
        'user_123',
      ]),
    ).toThrow('Use either --email or --user-id, not both.');
  });

  it('rejects invalid metadata JSON', () => {
    expect(() =>
      parseCreateApiKeyArgs([
        '--email',
        'user@example.com',
        '--metadata',
        '{nope',
      ]),
    ).toThrow('--metadata must be valid JSON.');
  });
});
