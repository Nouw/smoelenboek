import assert from 'node:assert/strict';
import test from 'node:test';

import {
  mapOneUptimeOverview,
  parseOneUptimeStatusPageUrl,
} from '../lib/oneuptime-status.ts';

const statusPageUrl =
  'https://status.example.com/status-page/adb4476a-3032-43e6-a826-c6e3a3208e18';

test('derives the public overview endpoint from a status page URL', () => {
  assert.deepEqual(parseOneUptimeStatusPageUrl(`${statusPageUrl}/`), {
    overviewUrl:
      'https://status.example.com/status-page-api/overview/adb4476a-3032-43e6-a826-c6e3a3208e18',
    statusPageUrl,
  });

  assert.equal(parseOneUptimeStatusPageUrl(undefined), null);
  assert.equal(parseOneUptimeStatusPageUrl('javascript:alert(1)'), null);
  assert.equal(parseOneUptimeStatusPageUrl('https://status.example.com'), null);
});

test('maps active OneUptime events to safe alert data', () => {
  const alerts = mapOneUptimeOverview(
    {
      activeAnnouncements: [
        {
          _id: 'announcement-id',
          description: 'A service announcement',
          title: 'Heads up',
        },
      ],
      activeIncidents: [
        {
          _id: 'incident-id',
          description: 'Login is unavailable',
          title: 'Login outage',
        },
      ],
      scheduledMaintenanceEvents: [
        {
          _id: 'maintenance-id',
          endsAt: { _type: 'DateTime', value: '2026-09-20T15:00:00.000Z' },
          startsAt: {
            _type: 'DateTime',
            value: '2026-09-20T10:00:00.000Z',
          },
          title: 'Server upgrade',
        },
        { _id: 'missing-title' },
      ],
    },
    statusPageUrl,
  );

  assert.deepEqual(
    alerts.map(({ kind, title }) => ({ kind, title })),
    [
      { kind: 'incident', title: 'Login outage' },
      { kind: 'maintenance', title: 'Server upgrade' },
      { kind: 'announcement', title: 'Heads up' },
    ],
  );
  assert.equal(alerts[1]?.startsAt, '2026-09-20T10:00:00.000Z');
  assert.equal(alerts[1]?.endsAt, '2026-09-20T15:00:00.000Z');
  assert.equal(
    alerts[1]?.url,
    `${statusPageUrl}/scheduled-events/maintenance-id`,
  );
});

test('treats malformed upstream data as no alerts', () => {
  assert.deepEqual(mapOneUptimeOverview(null, statusPageUrl), []);
  assert.deepEqual(
    mapOneUptimeOverview({ activeIncidents: {} }, statusPageUrl),
    [],
  );
});
