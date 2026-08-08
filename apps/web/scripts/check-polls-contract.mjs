import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [member, admin, detail, form, sidebar, home, translations, router] =
  await Promise.all([
    readFile(new URL('app/polls/polls-content.tsx', root), 'utf8'),
    readFile(new URL('app/polls/admin/polls-admin-content.tsx', root), 'utf8'),
    readFile(
      new URL('app/polls/admin/[pollId]/poll-admin-detail.tsx', root),
      'utf8',
    ),
    readFile(new URL('app/polls/admin/poll-form.tsx', root), 'utf8'),
    readFile(new URL('components/app-sidebar.tsx', root), 'utf8'),
    readFile(new URL('app/home-navigation.ts', root), 'utf8'),
    readFile(new URL('lib/i18n.tsx', root), 'utf8'),
    readFile(
      new URL('../../packages/rpc/src/polls/trpc/polls.router.ts', root),
      'utf8',
    ),
  ]);

assert.match(member, /polls\.list\.useQuery/);
assert.match(member, /polls\.vote\.useMutation/);
assert.match(
  member,
  /type=\{\s*poll\.choiceMode === 'single_choice'\s*\? 'radio'\s*: 'checkbox'\s*\}/,
);
assert.match(member, /poll\.selectedOptionIds/);
assert.doesNotMatch(member, /ballotCount|percentage|voters/);
for (const endpoint of ['admin.list', 'admin.create'])
  assert.ok(admin.includes(`polls.${endpoint}`));
for (const endpoint of [
  'admin.get',
  'admin.results',
  'admin.update',
  'admin.publish',
  'admin.archive',
  'admin.deleteDraft',
])
  assert.ok(detail.includes(`polls.${endpoint}`));
assert.match(form, /Europe\/Amsterdam|parseAmsterdamDateTime/);
assert.match(form, /options\.length >= 20/);
assert.match(sidebar, /url: '\/polls'/);
assert.match(sidebar, /url: '\/polls\/admin'/);
assert.match(home, /url: '\/polls'/);
assert.match(translations, /Peilingen beheren/);
assert.match(translations, /Poll management/);
assert.match(router, /list: protectedProcedure/);
assert.match(router, /admin: router/);
assert.match(router, /adminProcedure/);

console.log('Polls web contract passed.');
