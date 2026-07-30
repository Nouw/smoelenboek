import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [
  participant,
  standings,
  admin,
  adminRoundPage,
  model,
  shell,
  sidebar,
  translations,
] = await Promise.all([
  readFile(new URL('app/protototo/protototo-content.tsx', root), 'utf8'),
  readFile(
    new URL('app/protototo/standings/standings-content.tsx', root),
    'utf8',
  ),
  readFile(
    new URL('app/protototo/admin/protototo-admin-content.tsx', root),
    'utf8',
  ),
  readFile(new URL('app/protototo/admin/[roundId]/page.tsx', root), 'utf8'),
  readFile(new URL('app/protototo/protototo-model.ts', root), 'utf8'),
  readFile(new URL('app/app-shell.tsx', root), 'utf8'),
  readFile(new URL('components/app-sidebar.tsx', root), 'utf8'),
  readFile(new URL('lib/i18n.tsx', root), 'utf8'),
]);

for (const endpoint of [
  'protototo.current.useQuery',
  'protototo.lookupAnonymousEntry.useMutation',
  'protototo.submitEntry.useMutation',
  'protototo.memberRounds.useQuery',
  'protototo.myEntry.useQuery',
]) {
  assert.ok(
    participant.includes(endpoint),
    `Participant flow missing ${endpoint}`,
  );
}
assert.match(standings, /protototo\.standings\.useQuery/);
assert.match(participant, /setWinners/);
assert.match(participant, /paymentClaimed/);
assert.match(participant, /tikkieOpened/);
assert.match(participant, /!signedIn && round\.tikkieUrl/);
assert.match(participant, /aria-pressed/);
assert.match(participant, /role="group"/);
assert.match(participant, /new Date\(round\.closesAt\) <= now/);
assert.match(model, /return 'best_of_5'/);
assert.match(model, /format === 'four_sets'/);
assert.match(model, /format === 'four_plus_one'/);
assert.match(model, /timeZone: 'Europe\/Amsterdam'/);
assert.match(model, /entriesToCsv/);
assert.match(model, /formulaSafeValue/);

for (const endpoint of [
  'admin.listRounds.useQuery',
  'admin.getRound.useQuery',
  'admin.createRound.useMutation',
  'admin.updateRound.useMutation',
  'admin.publishRound.useMutation',
  'admin.archiveRound.useMutation',
  'admin.listNevoboTeams.useQuery',
  'admin.listNevoboMatches.useQuery',
  'admin.addMatch.useMutation',
  'admin.removeMatch.useMutation',
  'admin.syncResults.useMutation',
  'admin.listEntries.useQuery',
]) {
  assert.ok(admin.includes(endpoint), `Admin flow missing ${endpoint}`);
}

assert.match(admin, /useCurrentUser/);
assert.match(admin, /currentUser\.isAdmin/);
assert.match(admin, /new Blob\(\[csv\]/);
assert.match(admin, /parseAmsterdamDateTime/);
assert.match(admin, /timeZone: 'Europe\/Amsterdam'/);
assert.ok(admin.includes('href={`/protototo/admin/${round.id}`}'));
assert.doesNotMatch(admin, /setSelectedRoundId/);
assert.match(adminRoundPage, /ProtototoAdminContent roundId=/);
assert.match(shell, /pathname === '\/protototo'/);
assert.match(shell, /PublicProtototoLayout/);
assert.match(sidebar, /url: "\/protototo"/);
assert.match(sidebar, /url: "\/protototo\/admin"/);
assert.match(translations, /Protototo-beheer/);
assert.match(translations, /Protototo management/);
assert.match(translations, /Er is momenteel geen actieve Protototo-ronde/);
assert.match(translations, /There is currently no active Protototo round/);

console.log('Protototo web contract passed.');
