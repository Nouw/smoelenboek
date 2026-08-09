'use client';

import { useI18n, type TranslationKey } from '@/lib/i18n';
import {
  homeNavigationItems,
  type HomeNavigationItem,
} from './home-navigation';
import { SectionPlaceholder } from './home-section-placeholder';

const homeCopy = {
  teams: {
    label: 'nav.teams',
    description: 'home.teamsDescription',
  },
  committees: {
    label: 'nav.committees',
    description: 'home.committeesDescription',
  },
  documents: {
    label: 'nav.documents',
    description: 'home.documentsDescription',
  },
  protototo: {
    label: 'nav.protototo',
    description: 'home.protototoDescription',
  },
  polls: {
    label: 'nav.polls',
    description: 'home.pollsDescription',
  },
  sponsorhengel: {
    label: 'nav.sponsorhengel',
    description: 'home.sponsorhengelDescription',
  },
} satisfies Record<
  HomeNavigationItem['key'],
  { label: TranslationKey; description: TranslationKey }
>;

export function HomeContent() {
  const { t } = useI18n();

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-normal">
          {t('home.title')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('home.description')}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {homeNavigationItems.map((item) => {
          const copy = homeCopy[item.key];

          return (
            <SectionPlaceholder
              key={item.key}
              item={item}
              label={t(copy.label)}
              description={t(copy.description)}
            />
          );
        })}
      </div>
    </>
  );
}
