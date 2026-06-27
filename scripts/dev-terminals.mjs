import { spawnSync } from 'node:child_process';
import { platform } from 'node:os';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const processes = [
  {
    title: 'smoelenboek:web',
    command: 'pnpm --filter web dev',
  },
  {
    title: 'smoelenboek:rpc',
    command: 'pnpm --filter @repo/rpc dev',
  },
  {
    title: 'smoelenboek:api',
    command: 'pnpm --filter api dev',
  },
  {
    title: 'smoelenboek:contracts',
    command: 'pnpm --filter @repo/api dev',
  },
];

if (platform() !== 'darwin') {
  console.error(
    'Separate terminal launching is implemented for macOS Terminal. Use `pnpm dev:turbo` on this platform.',
  );
  process.exit(1);
}

const script = [
  'tell application "Terminal"',
  '  activate',
  ...processes.map(
    ({ title, command }) =>
      `  do script ${appleScriptString(
        [
          `cd ${shellQuote(root)}`,
          `printf '\\033]0;${title}\\007'`,
          command,
        ].join(' && '),
      )}`,
  ),
  'end tell',
].join('\n');

if (process.argv.includes('--print')) {
  console.log(script);
  process.exit(0);
}

const result = spawnSync('osascript', ['-e', script], {
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

function appleScriptString(value) {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function shellQuote(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}
