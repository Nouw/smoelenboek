export const INSERT_CREDENTIAL_ACCOUNT_SQL = `
  INSERT INTO "account" ("accountId", "providerId", "userId", "password")
  VALUES ($1, 'credential', $2, $3)
`;

export function createCredentialAccountValues(
  userId: string,
  passwordHash: string,
): [string, string, string] {
  return [userId, userId, passwordHash];
}
