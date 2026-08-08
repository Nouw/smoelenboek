# Polls service

Owns scheduled member polls, options, member ballots, and admin-only results.

## Contract

- Members receive open polls plus non-archived polls they answered. Member output contains only their selections.
- A ballot is unique per `(pollId, userId)` and a later submission replaces its selections atomically.
- Admins create drafts, publish, extend schedules, archive published polls, and delete drafts.
- Ballot fields lock after the first response. The closing time may only move later.
- Poll and response mutations append an event and project the read model in one transaction.

Run gate tests with `pnpm --filter @repo/rpc test -- polls` and the periodic check with `pnpm --filter @repo/rpc eval:polls`.
