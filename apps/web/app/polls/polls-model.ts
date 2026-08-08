export function formatPollDateTime(value: string, locale: 'nl' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Amsterdam',
  }).format(new Date(value));
}

export function toLocalInput(value: string): string {
  const parts = amsterdamDateTimeParts(new Date(value));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function parseAmsterdamDateTime(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const wallTimeUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  let instant = new Date(wallTimeUtc);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    instant = new Date(wallTimeUtc - amsterdamOffsetMs(instant));
  }
  return toLocalInput(instant.toISOString()) === value ? instant : null;
}

function amsterdamOffsetMs(date: Date): number {
  const parts = amsterdamDateTimeParts(date);
  return (
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
    ) - date.getTime()
  );
}

function amsterdamDateTimeParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  );
  return {
    year: values.year ?? '',
    month: values.month ?? '',
    day: values.day ?? '',
    hour: values.hour ?? '',
    minute: values.minute ?? '',
  };
}
