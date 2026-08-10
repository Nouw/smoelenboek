import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  validateReleaseWorkflow,
  validateWebDockerfile,
  validateNextConfig,
} from './release-workflow-contract.mjs';

const [workflow, webDockerfile, nextConfig] = await Promise.all([
  readFile(
    new URL('../.github/workflows/release.yml', import.meta.url),
    'utf8',
  ),
  readFile(new URL('../apps/web/Dockerfile', import.meta.url), 'utf8'),
  readFile(new URL('../apps/web/next.config.js', import.meta.url), 'utf8'),
]);

test('release workflow publishes outputs and migrates on the Compose network', () => {
  const result = validateReleaseWorkflow(workflow);

  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.forbidden, []);
  assert.equal(result.ordered, true);
  assert.equal(result.valid, true);
});

test('Next.js standalone tracing root uses its supported top-level option', () => {
  const result = validateNextConfig(nextConfig);

  assert.equal(result.hasTracingRoot, true);
  assert.equal(result.usesLegacyPlacement, false);
  assert.equal(result.valid, true);
});

test('web image includes dependency links for imported workspace packages', () => {
  const result = validateWebDockerfile(webDockerfile);

  assert.deepEqual(result.missing, []);
  assert.equal(result.valid, true);
});
