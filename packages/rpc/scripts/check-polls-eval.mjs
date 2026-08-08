import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [migration, handler, router, policy, readme] = await Promise.all([
  readFile(
    new URL('src/database/migrations/1769100000000-CreatePolls.ts', root),
    'utf8',
  ),
  readFile(new URL('src/polls/commands/poll.handlers.ts', root), 'utf8'),
  readFile(new URL('src/polls/trpc/polls.router.ts', root), 'utf8'),
  readFile(new URL('src/polls/polls.policy.ts', root), 'utf8'),
  readFile(new URL('src/polls/README.md', root), 'utf8'),
]);

const criteria = [
  [
    'normalized constrained storage',
    /poll_responses/.test(migration) &&
      /poll_selections/.test(migration) &&
      /UNIQUE/.test(migration),
  ],
  [
    'transactional poll lock',
    /findPollForUpdate/.test(handler) &&
      /appendPreparedAndProject/.test(handler),
  ],
  [
    'replacement ballot',
    /projectResponse/.test(handler) &&
      /selections\.delete/.test(
        await readFile(
          new URL('src/polls/projectors/polls.projector.ts', root),
          'utf8',
        ),
      ),
  ],
  [
    'member and admin authorization',
    /protectedProcedure/.test(router) && /adminProcedure/.test(router),
  ],
  [
    'private member contract',
    /selectedOptionIds/.test(
      await readFile(new URL('../api/src/polls/dto/poll.dto.ts', root), 'utf8'),
    ) && !/ballotCount.*pollSchema/s.test(router),
  ],
  [
    'all lifecycle states',
    ['draft', 'scheduled', 'open', 'closed', 'archived'].every((state) =>
      policy.includes(`'${state}'`),
    ),
  ],
  [
    'service contract documented',
    /Members receive/.test(readme) && /atomically/.test(readme),
  ],
];
const passing = criteria.filter(([, passed]) => passed).length;
for (const [name, passed] of criteria)
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
const score = Math.round((passing / criteria.length) * 100);
if (score < 90)
  throw new Error(`Polls RPC eval scored ${score}; required score is 90.`);
console.log(`Polls RPC eval passed with ${score}/100.`);
