import { readFile } from 'node:fs/promises';
import process from 'node:process';

const root = new URL('../', import.meta.url);
const [route, component, mapper, shell, translations, envExample, deployment] =
  await Promise.all([
    readFile(new URL('app/api/oneuptime/status/route.ts', root), 'utf8'),
    readFile(new URL('components/oneuptime-alerts.tsx', root), 'utf8'),
    readFile(new URL('lib/oneuptime-status.ts', root), 'utf8'),
    readFile(new URL('app/app-shell.tsx', root), 'utf8'),
    readFile(new URL('lib/i18n.tsx', root), 'utf8'),
    readFile(new URL('.env.example', root), 'utf8'),
    readFile(new URL('../../DEPLOYMENT.md', root), 'utf8'),
  ]);

const criteria = [
  [
    'Uses the public OneUptime overview endpoint',
    /status-page-api\/overview/.test(mapper) && /method: 'POST'/.test(route),
  ],
  [
    'Keeps OneUptime configuration server-side',
    /process\.env\.ONEUPTIME_STATUS_PAGE_URL/.test(route) &&
      !/NEXT_PUBLIC_ONEUPTIME/.test(route + component),
  ],
  [
    'Covers incidents, maintenance, and announcements',
    [
      'activeIncidents',
      'scheduledMaintenanceEvents',
      'activeAnnouncements',
    ].every((term) => mapper.includes(term)),
  ],
  [
    'Refreshes alerts without a page reload',
    /setInterval\(loadAlerts, REFRESH_INTERVAL_MS\)/.test(component) &&
      /REFRESH_INTERVAL_MS = 60_000/.test(component),
  ],
  [
    'Does not block the app when OneUptime is unavailable',
    /status: 502/.test(route) &&
      /if \(!response\.ok\) \{\s*return;/.test(component),
  ],
  [
    'Shows alerts on public and authenticated layouts',
    (shell.match(/<OneUptimeAlerts \/>/g) ?? []).length >= 4,
  ],
  [
    'Provides accessible alert updates and detail links',
    /aria-live="polite"/.test(component) &&
      /target="_blank"/.test(component) &&
      /className="sr-only"/.test(component),
  ],
  [
    'Localizes alert labels',
    /Gepland onderhoud/.test(translations) &&
      /Scheduled maintenance/.test(translations),
  ],
  [
    'Documents deployment configuration',
    /ONEUPTIME_STATUS_PAGE_URL/.test(envExample) &&
      /ONEUPTIME_STATUS_PAGE_URL/.test(deployment),
  ],
];

const passed = criteria.filter(([, result]) => result).length;
const score = Math.round((passed / criteria.length) * 100);

for (const [name, result] of criteria) {
  console.log(`${result ? 'PASS' : 'FAIL'} ${name}`);
}

console.log(`OneUptime alert UX: ${score}/100.`);

if (score !== 100) {
  process.exitCode = 1;
}
