'use client';

import { Languages } from 'lucide-react';

import { useI18n, type Locale } from '@/lib/i18n';
import { Button } from '@repo/ui/components/button';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const nextLocale: Locale = locale === 'nl' ? 'en' : 'nl';

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-2"
      aria-label={
        nextLocale === 'nl'
          ? t('language.switchToDutch')
          : t('language.switchToEnglish')
      }
      onClick={() => setLocale(nextLocale)}
    >
      <Languages className="size-4" />
      <span className="text-xs font-medium uppercase">{locale}</span>
    </Button>
  );
}
