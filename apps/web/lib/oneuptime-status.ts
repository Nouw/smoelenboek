export type OneUptimeAlertKind = 'incident' | 'maintenance' | 'announcement';

export type OneUptimeAlert = {
  id: string;
  kind: OneUptimeAlertKind;
  title: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
  url: string;
};

export type OneUptimeStatusPageConfig = {
  overviewUrl: string;
  statusPageUrl: string;
};

type UnknownRecord = Record<string, unknown>;

const STATUS_PAGE_PATH = /^(.*\/status-page\/)([0-9a-f-]{36})\/?$/i;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object'
    ? (value as UnknownRecord)
    : null;
}

function readString(record: UnknownRecord, key: string): string | null {
  const value = record[key];

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function readDate(record: UnknownRecord, key: string): string | null {
  const value = record[key];

  if (typeof value === 'string') {
    return Number.isNaN(Date.parse(value)) ? null : value;
  }

  const dateRecord = asRecord(value);
  const dateValue = dateRecord ? readString(dateRecord, 'value') : null;

  return dateValue && !Number.isNaN(Date.parse(dateValue)) ? dateValue : null;
}

function readItems(payload: UnknownRecord, key: string): UnknownRecord[] {
  const value = payload[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(asRecord).filter((item): item is UnknownRecord => !!item);
}

function mapItems(
  items: UnknownRecord[],
  kind: OneUptimeAlertKind,
  route: string,
  statusPageUrl: string,
): OneUptimeAlert[] {
  return items.flatMap((item) => {
    const id = readString(item, '_id') ?? readString(item, 'id');
    const title = readString(item, 'title');

    if (!id || !title) {
      return [];
    }

    return [
      {
        id,
        kind,
        title,
        description: readString(item, 'description'),
        startsAt: readDate(item, 'startsAt'),
        endsAt: readDate(item, 'endsAt'),
        url: `${statusPageUrl}/${route}/${encodeURIComponent(id)}`,
      },
    ];
  });
}

export function parseOneUptimeStatusPageUrl(
  value: string | undefined,
): OneUptimeStatusPageConfig | null {
  const configuredUrl = value?.trim();

  if (!configuredUrl) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(configuredUrl);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return null;
  }

  const match = url.pathname.match(STATUS_PAGE_PATH);

  if (!match) {
    return null;
  }

  const statusPageId = match[2];
  const statusPageUrl = `${url.origin}${url.pathname.replace(/\/$/, '')}`;

  return {
    overviewUrl: new URL(
      `/status-page-api/overview/${statusPageId}`,
      url.origin,
    ).toString(),
    statusPageUrl,
  };
}

export function mapOneUptimeOverview(
  value: unknown,
  statusPageUrl: string,
): OneUptimeAlert[] {
  const payload = asRecord(value);

  if (!payload) {
    return [];
  }

  return [
    ...mapItems(
      readItems(payload, 'activeIncidents'),
      'incident',
      'incidents',
      statusPageUrl,
    ),
    ...mapItems(
      readItems(payload, 'scheduledMaintenanceEvents'),
      'maintenance',
      'scheduled-events',
      statusPageUrl,
    ),
    ...mapItems(
      readItems(payload, 'activeAnnouncements'),
      'announcement',
      'announcements',
      statusPageUrl,
    ),
  ];
}
