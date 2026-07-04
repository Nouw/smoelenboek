import { describe, expect, it } from '@jest/globals';

import {
  INSERT_CREDENTIAL_ACCOUNT_SQL,
  createCredentialAccountValues,
} from './credential-account';

describe('credential account insert', () => {
  it('uses distinct placeholders for text accountId and uuid userId', () => {
    expect(INSERT_CREDENTIAL_ACCOUNT_SQL).toContain(
      `VALUES ($1, 'credential', $2, $3)`,
    );
    expect(createCredentialAccountValues('user-id', 'hashed-password')).toEqual([
      'user-id',
      'user-id',
      'hashed-password',
    ]);
  });
});
