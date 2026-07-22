import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [i18n, switcher, providers] = await Promise.all([
  readFile(new URL('lib/i18n.tsx', root), 'utf8'),
  readFile(new URL('components/language-switcher.tsx', root), 'utf8'),
  readFile(new URL('app/providers.tsx', root), 'utf8'),
]);

assert.match(i18n, /locales = \['nl', 'en'\]/);
assert.match(i18n, /smoelenboek-locale/);
assert.match(i18n, /document\.documentElement\.lang/);
assert.match(i18n, /Missing translation for key/);
assert.match(switcher, /setLocale/);
assert.match(switcher, /language\.switchToDutch/);
assert.match(switcher, /language\.switchToEnglish/);
assert.match(providers, /<I18nProvider>/);

console.log('Web i18n contract passed.');
