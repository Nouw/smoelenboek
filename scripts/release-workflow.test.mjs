import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validateReleaseWorkflow } from './release-workflow-contract.mjs';

const workflow = await readFile(
  new URL('../.github/workflows/release.yml', import.meta.url),
  'utf8',
);

test('release workflow publishes outputs and migrates on the Compose network', () => {
  const result = validateReleaseWorkflow(workflow);

  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.forbidden, []);
  assert.equal(result.ordered, true);
  assert.equal(result.valid, true);
});
