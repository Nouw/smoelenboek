import { readFile } from 'node:fs/promises';
import { validateReleaseWorkflow } from './release-workflow-contract.mjs';

const workflow = await readFile(
  new URL('../.github/workflows/release.yml', import.meta.url),
  'utf8',
);
const result = validateReleaseWorkflow(workflow);

if (!result.valid) {
  throw new Error(
    `Release workflow contract failed: ${JSON.stringify(result)}`,
  );
}

console.log(
  `Release workflow eval: ${result.checks}/${result.checks} checks passed`,
);
