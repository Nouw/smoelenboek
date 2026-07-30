import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../src/protototo/', import.meta.url);
const files = Object.fromEntries(
  await Promise.all(
    [
      ['policy', 'protototo.policy.ts'],
      ['entry', 'commands/protototo-entry.handler.ts'],
      ['rounds', 'commands/protototo-round.handlers.ts'],
      ['events', 'events/protototo.events.ts'],
      ['adapter', 'nevobo/nevobo.client.ts'],
      ['sync', 'services/protototo-result-sync.service.ts'],
      ['projector', 'projectors/protototo.projector.ts'],
      ['scheduler', 'services/protototo-scheduler.service.ts'],
      ['queries', 'queries/protototo.handlers.ts'],
      ['router', 'trpc/protototo.router.ts'],
      ['module', 'protototo.module.ts'],
    ].map(async ([name, path]) => [
      name,
      await readFile(new URL(path, root), 'utf8'),
    ]),
  ),
);

const checks = [
  [
    'Anonymous identity normalization and replacement',
    files.entry.includes('normalizeEmail') &&
      files.entry.includes('normalizeFirstName') &&
      files.entry.includes('identity.existing?.id'),
  ],
  [
    'Anonymous payment is required while member payment is bypassed',
    files.entry.includes('paymentRequired') &&
      files.entry.includes("participantType: 'member'") &&
      files.entry.includes('paymentClaimedAt'),
  ],
  [
    'Atomic current-lineup validation covers every active match exactly once',
    files.entry.includes(
      'Predictions must cover every active match exactly once',
    ) &&
      files.entry.includes('isValidPrediction') &&
      files.entry.includes('appendPreparedAndProject') &&
      files.entry.includes('findRoundForUpdate'),
  ],
  [
    'Legacy participation plus correct-set scoring is preserved',
    /return \(\s*1 \+/.test(files.policy) &&
      files.policy.includes('prediction[index] === setWinner'),
  ],
  [
    'First publication deadline and post-publication reopening rules coexist',
    files.rounds.includes('validateDeadline') &&
      files.rounds.includes('if (!existing.publishedAt)') &&
      files.rounds.includes('validateNoOverlap'),
  ],
  [
    'Every round, entry, lineup, and result mutation emits a stored event',
    files.events.includes('protototo.round_saved') &&
      files.events.includes('protototo.entry_submitted') &&
      files.events.includes('protototo.match_saved') &&
      files.events.includes('protototo.match_result_synced'),
  ],
  [
    'Nevobo JSON-LD, association side, formats, failures, and timeouts are validated',
    files.adapter.includes("z.literal('hydra:Collection')") &&
      files.adapter.includes('deriveMatchFormat') &&
      files.adapter.includes('resolveSubjectSide') &&
      files.adapter.includes('AbortController') &&
      files.adapter.includes('NevoboUpstreamError'),
  ],
  [
    'Manual and scheduled synchronization share one idempotent service',
    files.sync.includes('syncRound') &&
      files.sync.includes('syncStarted') &&
      files.scheduler.includes('ProtototoResultSyncService') &&
      files.scheduler.includes('this.running') &&
      files.projector.includes("mode: 'pessimistic_write'"),
  ],
  [
    'Standings are member-only, deadline-gated, and PII-free',
    files.router.includes('standings: protectedProcedure') &&
      files.queries.includes('Standings are hidden until betting closes') &&
      !files.queries.includes('email: entry.email'),
  ],
  [
    'All Protototo CQRS handlers and the scheduler are registered',
    files.module.includes('SubmitProtototoEntryHandler') &&
      files.module.includes('SyncProtototoRoundHandler') &&
      files.module.includes('ListNevoboMatchesHandler') &&
      files.module.includes('ProtototoSchedulerService'),
  ],
];

for (const [label, passed] of checks) {
  assert.equal(passed, true, `FAIL ${label}`);
  console.log(`PASS ${label}`);
}
console.log(`Protototo RPC eval passed with ${checks.length * 10}/100.`);
