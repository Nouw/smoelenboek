import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const cssDir = join('.next', 'static', 'css');
const css = readdirSync(cssDir)
  .filter((file) => file.endsWith('.css'))
  .map((file) => readFileSync(join(cssDir, file), 'utf8'))
  .join('\n');

const requiredPatterns = [
  ['.px-6', /\.px-6\{[^}]*padding-inline:calc\(var\(--spacing\) \* 6\)/],
  ['.py-6', /\.py-6\{[^}]*padding-block:calc\(var\(--spacing\) \* 6\)/],
  ['.px-4', /\.px-4\{[^}]*padding-inline:calc\(var\(--spacing\) \* 4\)/],
  ['.py-2', /\.py-2\{[^}]*padding-block:calc\(var\(--spacing\) \* 2\)/],
  ['.p-1', /\.p-1\{[^}]*padding:var\(--spacing\)/],
  ['.bg-card', /\.bg-card\{[^}]*background-color:var\(--card\)/],
];

const missing = requiredPatterns
  .filter(([, pattern]) => !pattern.test(css))
  .map(([name]) => name);

if (missing.length > 0) {
  throw new Error(`Built CSS missing required Shadcn/Tailwind rules: ${missing.join(', ')}`);
}

console.log('Built CSS contract passed.');
