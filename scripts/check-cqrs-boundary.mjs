import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const rpcSrc = join(root, 'services/rpc/src');

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

const routerFiles = listRouterFiles(rpcSrc);

const forbiddenPatterns = [
  /from ['"].*repositories\/.*['"]/,
  /from ['"].*entities\/.*['"]/,
  /\.save\(/,
  /\.insert\(/,
  /\.update\(/,
  /\.delete\(/,
];

const violations = [];

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

console.log(`CQRS boundary eval passed for ${routerFiles.length} router file(s).`);
