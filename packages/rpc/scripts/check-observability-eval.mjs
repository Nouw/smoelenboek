import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('../', import.meta.url);
const [health, telemetry, main, appModule, deployment, compose] =
  await Promise.all([
    readFile(new URL('src/health/health.controller.ts', root), 'utf8'),
    readFile(new URL('src/observability/rpc-telemetry.ts', root), 'utf8'),
    readFile(new URL('src/main.ts', root), 'utf8'),
    readFile(new URL('src/app.module.ts', root), 'utf8'),
    readFile(new URL('../../DEPLOYMENT.md', root), 'utf8'),
    readFile(new URL('../../docker-compose.prod.yml', root), 'utf8'),
  ]);

const runtimeConsoleCalls = await findRuntimeConsoleCalls(
  new URL('src/', root),
);
const telemetryStartsBeforeNest =
  main.indexOf('initializeRpcTelemetry()') < main.indexOf('NestFactory.create');

const criteria = [
  [
    'dependency-aware public health contract',
    /@Controller\('health'\)/.test(health) &&
      /SELECT 1/.test(health) &&
      /ServiceUnavailableException/.test(health) &&
      /Cache-Control', 'no-store'/.test(health),
  ],
  [
    'health module is registered',
    /HealthModule/.test(appModule) && /app\.enableShutdownHooks\(\)/.test(main),
  ],
  [
    'OneUptime OTLP batching and resource identity',
    /OTLPLogExporter/.test(telemetry) &&
      /BatchLogRecordProcessor/.test(telemetry) &&
      /'service\.name'/.test(telemetry) &&
      /x-oneuptime-token/.test(telemetry),
  ],
  [
    'exception fields support OneUptime extraction',
    ['exception.message', 'exception.stacktrace', 'exception.type'].every(
      (field) => telemetry.includes(`'${field}'`),
    ),
  ],
  [
    'telemetry starts before Nest and flushes on shutdown',
    telemetryStartsBeforeNest &&
      /shutdownRpcTelemetry/.test(appModule + main + telemetry) &&
      /provider\.shutdown\(\)/.test(telemetry),
  ],
  [
    'server logs use the global Nest logger seam',
    runtimeConsoleCalls.length === 0,
  ],
  [
    'Proxmox deployment is operable',
    /status\.home\.nouw\.net\/otlp/.test(deployment) &&
      /YOUR_TELEMETRY_INGESTION_KEY/.test(deployment) &&
      /\/health/.test(compose),
  ],
];

for (const [name, passed] of criteria) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
}

if (runtimeConsoleCalls.length > 0) {
  console.error(
    `Uncaptured server console calls: ${runtimeConsoleCalls.join(', ')}`,
  );
}

const passing = criteria.filter(([, passed]) => passed).length;
const score = Math.round((passing / criteria.length) * 100);
console.log(`RPC observability ${score}/100.`);

if (score !== 100) {
  process.exitCode = 1;
}

async function findRuntimeConsoleCalls(sourceUrl) {
  const sourcePath = sourceUrl.pathname;
  const excluded = new Set([
    'admin/create-api-key.ts',
    'admin/create-user.ts',
    'migrate.ts',
  ]);
  const calls = [];

  for (const file of await walk(sourcePath)) {
    const projectPath = relative(sourcePath, file);
    if (
      !file.endsWith('.ts') ||
      file.endsWith('.spec.ts') ||
      excluded.has(projectPath)
    ) {
      continue;
    }
    const source = await readFile(file, 'utf8');
    if (/\bconsole\.(?:debug|error|info|log|warn)\s*\(/.test(source)) {
      calls.push(projectPath);
    }
  }

  return calls.sort();
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path)));
    } else {
      files.push(path);
    }
  }
  return files;
}
