import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [page, profile, profileDialog, currentUserHook, navigation, translations] = await Promise.all([
  readFile(new URL('app/profile/[userId]/page.tsx', root), 'utf8'),
  readFile(new URL('app/profile/profile-content.tsx', root), 'utf8'),
  readFile(new URL('components/profile-edit-dialog.tsx', root), 'utf8'),
  readFile(new URL('hooks/use-current-user.ts', root), 'utf8'),
  readFile(new URL('components/nav-user.tsx', root), 'utf8'),
  readFile(new URL('lib/i18n.tsx', root), 'utf8'),
]);

assert.match(page, /params: Promise<\{ userId: string \}>/);
assert.match(page, /z\.uuid\(\)\.safeParse\(userId\)/);
assert.match(page, /<ProfileContent userId=\{parsedUserId\.data\}/);
assert.match(navigation, /'\/profile\/' \+ profileUserId/);
for (const query of [
  'trpc.user.byId.useQuery',
  'trpc.user.information.useQuery',
  'trpc.user.membershipHistory.useQuery',
  'trpc.teams.list.useQuery',
  'trpc.committees.list.useQuery',
]) {
  assert.ok(profile.includes(query), 'Profile page must query ' + query + '.');
}
assert.match(profile, /information\.useQuery\(\s*\{ userId \}/);
assert.match(profile, /membershipHistory\.useQuery\([\s\S]*\{ userId \}/);
assert.match(profile, /currentUser\.isOwner\(userId\)/);
assert.match(profile, /isOwner \|\| currentUser\.isAdmin/);
assert.match(currentUserHook, /trpc\.user\.me\.useQuery/);
assert.match(currentUserHook, /role === 'admin'/);
assert.match(currentUserHook, /isOwner/);
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
assert.doesNotMatch(profile, /UserInformationEditDialog/);
assert.match(profile, /hasOwnProperty\.call\(details, 'bankAccountNumber'\)/);
assert.match(profile, /details\.bankAccountNumber/);
assert.match(profileDialog, /trpc\.user\.updateInformation\.useMutation/);
assert.match(profileDialog, /authClient\.changeEmail/);
assert.match(profileDialog, /media\/profile-image/);
assert.match(profileDialog, /canEditAccount/);
assert.match(profileDialog, /currentUser\.isAdmin/);
assert.match(profileDialog, /mutateAsync\(\{\s*userId: targetUserId,/);
for (const field of [
  'streetName',
  'houseNumber',
  'postcode',
  'city',
  'phoneNumber',
  'bankAccountNumber',
  'backNumber',
]) {
  assert.ok(
    profileDialog.includes(field),
    'Profile dialog must edit ' + field + '.',
  );
}
assert.match(profile, /lg:grid-cols-/);
for (const [dutch, english] of [
  ["activities: 'Activiteiten'", "activities: 'Activities'"],
  ["birthDate: 'Geboortedatum'", "birthDate: 'Date of birth'"],
  [
    "bankAccountNumber: 'Rekeningnummer'",
    "bankAccountNumber: 'Bank account number'",
  ],
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
