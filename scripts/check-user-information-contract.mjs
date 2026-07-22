import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const violations = [];

requireTokens('packages/rpc/src/users/entities/user-information.entity.ts', [
  "name: 'user_information'",
  'userId',
  'bankAccountNumber',
  'bondNumber',
  'refereeLicense',
]);
requireTokens(
  'packages/rpc/src/users/events/user-information-updated.event.ts',
  [
    'user.information_updated',
    "aggregateType: 'user_information'",
    'actorUserId',
  ],
);
requireTokens('packages/rpc/src/users/user-information-policy.ts', [
  "actorRole === 'admin'",
  'actorUserId === targetUserId',
]);
requireTokens('packages/rpc/src/users/dto/user-information-output.ts', [
  'includeBankAccountNumber',
  '? { bankAccountNumber:',
]);
forbidTokens('packages/api/src/users/dto/user.dto.ts', [
  'bankAccountNumber',
  'streetName',
]);

if (violations.length > 0) {
  console.error('User information contract violations found:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('User information contract eval passed.');

function requireTokens(path, tokens) {
  const source = readFileSync(join(root, path), 'utf8');
  for (const token of tokens) {
    if (!source.includes(token)) {
      violations.push(`${path} is missing required token ${token}`);
    }
  }
}

function forbidTokens(path, tokens) {
  const source = readFileSync(join(root, path), 'utf8');
  for (const token of tokens) {
    if (source.includes(token)) {
      violations.push(`${path} contains forbidden token ${token}`);
    }
  }
}
