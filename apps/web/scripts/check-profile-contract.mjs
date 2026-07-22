import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [page, profile, navigation, translations] = await Promise.all([
  readFile(new URL('app/profile/page.tsx', root), 'utf8'),
  readFile(new URL('app/profile/profile-content.tsx', root), 'utf8'),
  readFile(new URL('components/nav-user.tsx', root), 'utf8'),
  readFile(new URL('lib/i18n.tsx', root), 'utf8'),
]);

assert.match(page, /<ProfileContent\s*\/>/);
assert.match(navigation, /href="\/profile"/);
for (const query of [
  'trpc.user.me.useQuery',
  'trpc.user.information.useQuery',
  'trpc.user.membershipHistory.useQuery',
  'trpc.teams.list.useQuery',
  'trpc.committees.list.useQuery',
]) {
  assert.ok(profile.includes(query), 'Profile page must query ' + query + '.');
}
for (const field of [
  "t('profile.email')",
  "t('profile.phoneNumber')",
  "t('profile.birthDate')",
  "t('profile.bondNumber')",
  "t('profile.registrationDate')",
  "t('profile.backNumber')",
  "t('profile.refereeLicense')",
]) {
  assert.ok(profile.includes(field), 'Profile page must render ' + field + '.');
}
assert.match(profile, /mailto:/);
assert.match(profile, /tel:/);
assert.match(profile, /google\.com\/maps\/search/);
assert.match(profile, /right\.seasonKey - left\.seasonKey/);
assert.match(profile, /teamNames\.get/);
assert.match(profile, /committeeNames\.get/);
assert.match(profile, /<ProfileSkeleton\s*\/>/);
assert.match(profile, /<ProfileError/);
assert.match(profile, /profile\.noActivities/);
assert.match(profile, /<ProfileEditDialog/);
assert.match(profile, /lg:grid-cols-/);
for (const [dutch, english] of [
  ["activities: 'Activiteiten'", "activities: 'Activities'"],
  ["birthDate: 'Geboortedatum'", "birthDate: 'Date of birth'"],
  ["contact: 'Contact'", "contact: 'Contact'"],
  ["details: 'Verenigingsgegevens'", "details: 'Association details'"],
  [
    "loadError: 'Profiel kon niet worden geladen'",
    "loadError: 'Profile could not be loaded'",
  ],
  [
    "noActivities: 'Nog geen activiteiten'",
    "noActivities: 'No activities yet'",
  ],
  ["phoneNumber: 'Telefoonnummer'", "phoneNumber: 'Phone number'"],
  ["title: 'Mijn profiel'", "title: 'My profile'"],
]) {
  assert.ok(
    translations.includes(dutch),
    'Missing Dutch profile copy: ' + dutch,
  );
  assert.ok(
    translations.includes(english),
    'Missing English profile copy: ' + english,
  );
}
console.log('Profile page contract passed.');
