import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceRoots = [
  join(root, 'packages/api/src'),
  join(root, 'packages/rpc/src'),
];

const files = sourceRoots.flatMap(listRuntimeFiles);
const violations = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const path = relative(root, file);

  if (/\bseasonId\b/.test(source)) {
    violations.push(`${path} still uses the legacy seasonId contract`);
  }
  if (/\bSeasonEntity\b|\bSeasonsRepository\b/.test(source)) {
    violations.push(`${path} still depends on stored seasons`);
  }
  if (
    path.endsWith('projector.ts') &&
    (path.includes('/teams/') || path.includes('/committees/'))
  ) {
    if (/repository\.delete\(/.test(source)) {
      violations.push(`${path} deletes membership history`);
    }
  }
}

requireSource(
  'packages/rpc/src/seasons/season-policy.ts',
  ['Europe/Amsterdam', 'endsBefore', 'getSeasonKey'],
  violations,
);
requireSource(
  'packages/rpc/src/teams/entities/team-membership.entity.ts',
  ['seasonKey', 'startedOn', 'endedOn'],
  violations,
);
requireSource(
  'packages/rpc/src/committees/entities/committee-membership.entity.ts',
  ['seasonKey', 'startedOn', 'endedOn'],
  violations,
);
forbidSource(
  'packages/rpc/src/seasons/trpc/season.router.ts',
  ['generate:', 'create:', 'update:', 'byId:'],
  violations,
);
requireSource(
  'packages/rpc/src/database/migrations/1767300000000-FixBetterAuthIdDefaults.ts',
  ['"id"::text ~*', '"id"::text::uuid'],
  violations,
);

if (violations.length > 0) {
  console.error('Season model contract violations found:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(
  `Season model eval passed for ${files.length} runtime source file(s).`,
);

function listRuntimeFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory)) {
    const absolutePath = join(directory, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      if (entry !== 'migrations') {
        files.push(...listRuntimeFiles(absolutePath));
      }
      continue;
    }

    if (entry.endsWith('.ts') && !entry.endsWith('.spec.ts')) {
      files.push(absolutePath);
    }
  }

  return files;
}

function requireSource(path, requiredTokens, errors) {
  const source = readFileSync(join(root, path), 'utf8');

  for (const token of requiredTokens) {
    if (!source.includes(token)) {
      errors.push(`${path} is missing required token ${token}`);
    }
  }
}

function forbidSource(path, forbiddenTokens, errors) {
  const source = readFileSync(join(root, path), 'utf8');

  for (const token of forbiddenTokens) {
    if (source.includes(token)) {
      errors.push(`${path} contains forbidden token ${token}`);
    }
  }
}
