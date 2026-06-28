import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const rpcSrc = join(root, 'packages/rpc/src');

function listRouterFiles(directory) {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      files.push(...listRouterFiles(absolutePath));
      continue;
    }

    if (entry.endsWith('.router.ts')) {
      files.push(absolutePath.replace(`${root}/`, ''));
    }
  }

  return files;
}

const violations = [];

const forbiddenPatterns = [
  /from ['"].*repositories\/.*['"]/,
  /from ['"].*entities\/.*['"]/,
  /\.save\(/,
  /\.insert\(/,
  /\.update\(/,
  /\.delete\(/,
];

const routerFiles = listRouterFiles(rpcSrc);
const commandHandlerFiles = listCommandHandlerFiles(rpcSrc);

for (const file of routerFiles) {
  const source = readFileSync(join(root, file), 'utf8');

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(source)) {
      violations.push(`${file} matches ${pattern}`);
    }
  }
}

if (violations.length > 0) {
  console.error('CQRS boundary violations found:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(
  `CQRS boundary eval passed for ${routerFiles.length} router file(s) and ${commandHandlerFiles.length} command handler file(s).`,
);

function listCommandHandlerFiles(directory) {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      files.push(...listCommandHandlerFiles(absolutePath));
      continue;
    }

    if (entry.endsWith('.handler.ts') && absolutePath.includes('/commands/')) {
      files.push(absolutePath.replace(`${root}/`, ''));
    }
  }

  for (const file of files) {
    const source = readFileSync(join(root, file), 'utf8');

    if (source.includes('syncFromClerk(')) {
      violations.push(`${file} calls the user read-model write path directly`);
    }

    if (
      source.includes('createUserSyncedFromClerkEvent') &&
      !source.includes('.appendAndProject(')
    ) {
      violations.push(`${file} creates a domain event without appending it`);
    }
  }

  return files;
}
