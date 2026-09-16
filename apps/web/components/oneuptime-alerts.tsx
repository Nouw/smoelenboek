'use client';

import {
  CalendarClock,
  CircleAlert,
  ExternalLink,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { useI18n, type Locale } from '@/lib/i18n';
import type {
  OneUptimeAlert,
  OneUptimeAlertKind,
} from '@/lib/oneuptime-status';

const REFRESH_INTERVAL_MS = 60_000;

const alertStyles: Record<
  OneUptimeAlertKind,
  { Icon: LucideIcon; className: string; labelKey: AlertLabelKey }
> = {
  incident: {
    Icon: CircleAlert,
    className:
      'border-red-300 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/60 dark:text-red-100',
    labelKey: 'status.incident',
  },
  maintenance: {
    Icon: CalendarClock,
    className:
      'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-100',
    labelKey: 'status.maintenance',
  },
  announcement: {
    Icon: Megaphone,
    className:
      'border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-100',
    labelKey: 'status.announcement',
  },
};

type AlertLabelKey =
  | 'status.incident'
  | 'status.maintenance'
  | 'status.announcement';

type StatusResponse = {
  alerts?: OneUptimeAlert[];
};

function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-NL' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatWindow(alert: OneUptimeAlert, locale: Locale): string | null {
  if (!alert.startsAt) {
    return null;
  }

  const start = formatDate(alert.startsAt, locale);

  if (!alert.endsAt) {
    return start;
  }

  return `${start} – ${formatDate(alert.endsAt, locale)}`;
}

export function OneUptimeAlerts() {
  const { locale, t } = useI18n();
  const [alerts, setAlerts] = useState<OneUptimeAlert[]>([]);

  useEffect(() => {
    let active = true;
    let request: AbortController | null = null;

    const loadAlerts = async () => {
      request?.abort();
      request = new AbortController();

      try {
        const response = await fetch('/api/oneuptime/status', {
          signal: request.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as StatusResponse;

        if (active && Array.isArray(payload.alerts)) {
          setAlerts(payload.alerts);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          return;
        }
      }
    };

    void loadAlerts();
    const interval = window.setInterval(loadAlerts, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      request?.abort();
      window.clearInterval(interval);
    };
  }, []);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <aside className="space-y-2 px-3 py-2 sm:px-4" aria-live="polite">
      {alerts.map((alert) => {
        const { Icon, className, labelKey } = alertStyles[alert.kind];
        const maintenanceWindow = formatWindow(alert, locale);

        return (
          <a
            className={`mx-auto flex max-w-7xl items-start gap-3 rounded-lg border px-4 py-3 shadow-sm transition-opacity hover:opacity-90 ${className}`}
            href={alert.url}
            key={`${alert.kind}:${alert.id}`}
            rel="noreferrer"
            target="_blank"
          >
            <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex-1 text-sm">
              <span className="font-semibold">{t(labelKey)}:</span>{' '}
              <span>{alert.title}</span>
              {maintenanceWindow ? (
                <span className="ml-2 font-medium">{maintenanceWindow}</span>
              ) : null}
              {alert.description ? (
                <span className="mt-1 block opacity-80">
                  {alert.description}
                </span>
              ) : null}
            </span>
            <ExternalLink
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span className="sr-only">{t('status.viewDetails')}</span>
          </a>
        );
      })}
    </aside>
  );
}
