import { readFile } from 'node:fs/promises';
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
const results = [
  validateReleaseWorkflow(workflow),
  validateWebDockerfile(webDockerfile),
  validateNextConfig(nextConfig),
];

if (results.some((result) => !result.valid)) {
  throw new Error(
    `Release workflow contract failed: ${JSON.stringify(results)}`,
  );
}

const checks = results.reduce((total, result) => total + result.checks, 0);
console.log(`Release workflow eval: ${checks}/${checks} checks passed`);
