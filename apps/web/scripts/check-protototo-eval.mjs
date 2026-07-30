import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [participant, standings, admin, model, shell, sidebar, translations] =
  await Promise.all([
    readFile(new URL('app/protototo/protototo-content.tsx', root), 'utf8'),
    readFile(
      new URL('app/protototo/standings/standings-content.tsx', root),
      'utf8',
    ),
    readFile(
      new URL('app/protototo/admin/protototo-admin-content.tsx', root),
      'utf8',
    ),
    readFile(new URL('app/protototo/protototo-model.ts', root), 'utf8'),
    readFile(new URL('app/app-shell.tsx', root), 'utf8'),
    readFile(new URL('components/app-sidebar.tsx', root), 'utf8'),
    readFile(new URL('lib/i18n.tsx', root), 'utf8'),
  ]);

const criteria = [
  [
    'Anonymous identity and replacement are supported',
    /firstName/.test(participant) &&
      /email/.test(participant) &&
      /lookupAnonymousEntry\.useMutation/.test(participant),
  ],
  [
    'Anonymous payment is gated while member payment is absent',
    /tikkieOpened/.test(participant) &&
      /paymentClaimed/.test(participant) &&
      /!signedIn && round\.tikkieUrl/.test(participant),
  ],
  [
    'Set predictions follow all Nevobo formats',
    /best_of_5/.test(model) &&
      /four_sets/.test(model) &&
      /four_plus_one/.test(model),
  ],
  [
    'Prediction controls are accessible',
    /aria-pressed/.test(participant) &&
      /role="group"/.test(participant) &&
      /focus-visible:ring-2/.test(participant),
  ],
  [
    'Member history and protected standings exist',
    /memberRounds/.test(participant) &&
      /myEntry/.test(participant) &&
      /standings\.useQuery/.test(standings),
  ],
  [
    'Public routing preserves the signed-in shell',
    /isPublicProtototo/.test(shell) &&
      /if \(session\.data\)/.test(shell) &&
      /PublicProtototoLayout/.test(shell),
  ],
  [
    'Admin access is role-gated and linked conditionally',
    /currentUser\.isAdmin/.test(admin) &&
      /isAdmin/.test(sidebar) &&
      /\/protototo\/admin/.test(sidebar),
  ],
  [
    'Admin owns the full round and match workflow',
    /createRound/.test(admin) &&
      /publishRound/.test(admin) &&
      /listNevoboMatches/.test(admin) &&
      /syncResults/.test(admin),
  ],
  [
    'Admin CSV includes payment, completeness, per-match points, and total',
    /paymentClaimed/.test(model) &&
      /complete/.test(model) &&
      /points:/.test(model) &&
      /totalPoints/.test(model) &&
      /formulaSafeValue/.test(model),
  ],
  [
    'Loading, error, empty, and responsive states are present',
    /isLoading/.test(participant) &&
      /isError/.test(participant) &&
      /noRound/.test(participant) &&
      /sm:grid-cols-2/.test(participant) &&
      /overflow-x-auto/.test(admin),
  ],
  [
    'Times render and save in the association timezone',
    /Europe\/Amsterdam/.test(model) &&
      /parseAmsterdamDateTime/.test(admin) &&
      /Europe\/Amsterdam/.test(admin),
  ],
  [
    'Dutch and English copy cover participant and admin flows',
    /De inzending is gesloten/.test(translations) &&
      /Entries are closed/.test(translations) &&
      /Er is momenteel geen actieve Protototo-ronde/.test(translations) &&
      /There is currently no active Protototo round/.test(translations) &&
      /Protototo-beheer/.test(translations) &&
      /Protototo management/.test(translations),
  ],
];

const passing = criteria.filter(([, passed]) => passed).length;
const score = Math.round((passing / criteria.length) * 100);

for (const [criterion, passed] of criteria) {
  console.log(`${passed ? 'PASS' : 'FAIL'} ${criterion}`);
}

if (score < 90) {
  throw new Error(`Protototo web eval scored ${score}; required score is 90.`);
}

console.log(`Protototo web eval passed with ${score}/100.`);
