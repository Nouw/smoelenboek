import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [member, admin, detail, form, model, translations] = await Promise.all([
  readFile(new URL('app/polls/polls-content.tsx', root), 'utf8'),
  readFile(new URL('app/polls/admin/polls-admin-content.tsx', root), 'utf8'),
  readFile(
    new URL('app/polls/admin/[pollId]/poll-admin-detail.tsx', root),
    'utf8',
  ),
  readFile(new URL('app/polls/admin/poll-form.tsx', root), 'utf8'),
  readFile(new URL('app/polls/polls-model.ts', root), 'utf8'),
  readFile(new URL('lib/i18n.tsx', root), 'utf8'),
]);
const criteria = [
  [
    'single and multiple controls',
    /'radio' : 'checkbox'/.test(member) && /multiple_choice/.test(form),
  ],
  [
    'member vote replacement',
    /updateVote/.test(member) && /polls\.vote\.useMutation/.test(member),
  ],
  ['member privacy', !/ballotCount|percentage|voters/.test(member)],
  [
    'admin lifecycle',
    /admin\.create/.test(admin) &&
      /admin\.publish/.test(detail) &&
      /admin\.archive/.test(detail) &&
      /admin\.deleteDraft/.test(detail),
  ],
  [
    'admin aggregates and identities',
    /percentage/.test(detail) &&
      /row\.original\.user\.name/.test(detail) &&
      /row\.original\.optionIds/.test(detail),
  ],
  [
    'ballot lock affordance',
    /lockBallotFields=\{responseCount > 0\}/.test(detail) &&
      /disabled=\{lockBallotFields\}/.test(form),
  ],
  [
    'Amsterdam scheduling',
    /Europe\/Amsterdam/.test(model) && /parseAmsterdamDateTime/.test(form),
  ],
  [
    'accessible states and fields',
    /fieldset/.test(member) &&
      /legend/.test(member) &&
      /role="alert"/.test(member) &&
      /isLoading/.test(member) &&
      /isError/.test(member),
  ],
  [
    'Dutch and English coverage',
    /Peilingen beheren/.test(translations) &&
      /Poll management/.test(translations) &&
      /Je stem is opgeslagen/.test(translations) &&
      /Your vote has been saved/.test(translations),
  ],
];
const passing = criteria.filter(([, passed]) => passed).length;
for (const [name, passed] of criteria)
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const score = Math.round((passing / criteria.length) * 100);
if (score < 90)
  throw new Error(`Polls web eval scored ${score}; required score is 90.`);
console.log(`Polls web eval passed with ${score}/100.`);
