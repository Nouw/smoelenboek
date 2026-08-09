# Adding an event listener

Event listeners subscribe to domain events via the NestJS CQRS `@EventsHandler` decorator. The dispatcher calls every registered handler sequentially after the event's store row is committed, so the write is durable before your handler runs.

This guide shows how to add a **side-effect handler** — one that reacts to an event to trigger a secondary action (email, webhook, audit log). For read model projection, follow the projector pattern already in place (`TeamProjector`, `PollsProjector`, etc.).

## 1. Pick the event

All domain events live under `src/<module>/events/`. Each event class extends `DomainEventBase` and exposes a typed `payload` and `metadata`.

```ts
// src/teams/events/team-events.ts (excerpt)
export class TeamMemberAssignedEvent extends DomainEventBase<TeamMembershipAssignedPayload, ManualMetadata> {
  readonly aggregateType = 'team';
  readonly eventType = TEAM_MEMBER_ASSIGNED_EVENT;
  readonly eventVersion = 2;
  get aggregateId(): string { return this.payload.membershipId; }
}
```

## 2. Write the handler

Create a new file in a logical location — if the handler lives in your module, put it there. If it crosses module boundaries (e.g. it sends an email when a team member is assigned), put it closest to the service it calls.

```ts
// src/teams/listeners/team-member-welcome.handler.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { TeamMemberAssignedEvent } from '../events/team-events';
import { EmailService } from '../../email/email.service';

@EventsHandler(TeamMemberAssignedEvent)
@Injectable()
export class TeamMemberWelcomeHandler implements IEventHandler<TeamMemberAssignedEvent> {
  private readonly logger = new Logger(TeamMemberWelcomeHandler.name);

  constructor(private readonly email: EmailService) {}

  async handle(event: TeamMemberAssignedEvent): Promise<void> {
    const { userId, teamId, seasonKey } = event.payload;

    await this.email.sendWelcomeToTeam({ userId, teamId, seasonKey });

    this.logger.log(JSON.stringify({
      event: 'team.member_welcomed',
      userId,
      teamId,
      seasonKey,
    }));
  }
}
```

**Rules:**
- The class must implement `IEventHandler<YourEventClass>`.
- `@EventsHandler(...)` receives one or more event classes. If you list multiple, use `instanceof` in `handle()` to branch.
- Make `handle()` idempotent. The dispatcher uses at-least-once delivery — a crash between dispatch and `markDispatched` causes redelivery. Design so running `handle()` twice produces the same outcome.

## 3. Register in the module

Add the handler to `providers` in the relevant module. The module must also import `EventStoreModule` (it provides the dispatcher which discovers all `@EventsHandler` instances via `DiscoveryModule`).

```ts
// src/teams/teams.module.ts
import { TeamMemberWelcomeHandler } from './listeners/team-member-welcome.handler';

@Module({
  imports: [EventStoreModule, ...],
  providers: [
    // ... existing providers
    TeamMemberWelcomeHandler,
  ],
})
export class TeamsModule {}
```

No manual wiring to the event bus is needed. The `DomainEventDispatcher` scans all providers at boot time via `DiscoveryService` and registers every `@EventsHandler` automatically.

## 4. Write the spec

```ts
// src/teams/listeners/team-member-welcome.handler.spec.ts
import { describe, expect, it, jest } from '@jest/globals';
import { TeamMemberAssignedEvent } from '../events/team-events';
import { TeamMemberWelcomeHandler } from './team-member-welcome.handler';

const payload = {
  membershipId: 'membership-1',
  userId: 'user-1',
  teamId: 'team-1',
  seasonKey: 2025,
  role: 'setter' as const,
  startedOn: '2025-09-01',
  endedOn: null as null,
};

describe('TeamMemberWelcomeHandler', () => {
  it('sends a welcome email for the assigned member', async () => {
    const sendWelcomeToTeam = jest.fn().mockResolvedValue(undefined);
    const handler = new TeamMemberWelcomeHandler({ sendWelcomeToTeam } as never);

    await handler.handle(new TeamMemberAssignedEvent(payload, { source: 'manual', actorUserId: 'admin-1' }));

    expect(sendWelcomeToTeam).toHaveBeenCalledWith({
      userId: 'user-1',
      teamId: 'team-1',
      seasonKey: 2025,
    });
  });

  it('is idempotent — calling handle twice does not throw', async () => {
    const sendWelcomeToTeam = jest.fn().mockResolvedValue(undefined);
    const handler = new TeamMemberWelcomeHandler({ sendWelcomeToTeam } as never);
    const event = new TeamMemberAssignedEvent(payload, { source: 'manual', actorUserId: 'admin-1' });

    await handler.handle(event);
    await handler.handle(event);

    expect(sendWelcomeToTeam).toHaveBeenCalledTimes(2);
  });
});
```

## Handling multiple events in one handler

When one handler reacts to several related events, list them all in `@EventsHandler` and branch on `instanceof`:

```ts
@EventsHandler(TeamCreatedEvent, TeamUpdatedEvent, TeamArchivedEvent)
@Injectable()
export class TeamAuditLogger implements IEventHandler<DomainEventBase> {
  async handle(event: DomainEventBase): Promise<void> {
    if (event instanceof TeamArchivedEvent) {
      await this.audit.record('team.archived', event.payload.teamId);
    } else {
      await this.audit.record(event.eventType, (event as TeamCreatedEvent).payload.teamId);
    }
  }
}
```

## What happens on failure

If `handle()` throws, the dispatcher:
1. Increments `dispatchAttempts` on the `stored_events` row.
2. Sets exponential backoff `nextDispatchAt` (doubles each attempt, capped at 1 hour).
3. Marks the row `failed` after 8 attempts and logs `event_store.dispatch_failed`.
4. Rethrows — the original command returns 5xx but the write IS committed.

The `StoredEventSweeper` retries pending rows every 5 seconds, so transient failures (flaky SMTP, momentary downstream outage) converge automatically.
