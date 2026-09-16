import { NextResponse } from 'next/server';

import {
  mapOneUptimeOverview,
  parseOneUptimeStatusPageUrl,
} from '@/lib/oneuptime-status';

const REQUEST_TIMEOUT_MS = 5_000;

export async function GET() {
  const config = parseOneUptimeStatusPageUrl(
    process.env.ONEUPTIME_STATUS_PAGE_URL,
  );

  if (!config) {
    return NextResponse.json(
      { alerts: [], configured: false, statusPageUrl: null },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const response = await fetch(config.overviewUrl, {
      body: '{}',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`OneUptime returned HTTP ${response.status}`);
    }

    const payload: unknown = await response.json();

    return NextResponse.json(
      {
        alerts: mapOneUptimeOverview(payload, config.statusPageUrl),
        configured: true,
        statusPageUrl: config.statusPageUrl,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        alerts: [],
        configured: true,
        statusPageUrl: config.statusPageUrl,
      },
      {
        headers: { 'Cache-Control': 'no-store' },
        status: 502,
      },
    );
  }
}
