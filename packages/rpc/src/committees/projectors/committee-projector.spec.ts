import { describe, expect, it, jest } from '@jest/globals';

import { CommitteeMembershipEntity } from '../entities/committee-membership.entity';
import { CommitteeEntity } from '../entities/committee.entity';
import {
  CommitteeCreatedEvent,
  CommitteeMemberAssignedEvent,
  CommitteeMemberRemovedEvent,
} from '../events/committee-events';
import { CommitteeProjector } from './committee-projector';

const snapshotPayload = {
  committeeId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
  name: 'Bestuur',
  archivedAt: null as null,
};

const assignedPayload = {
  membershipId: '02ac256b-ce8f-44e9-8913-7569c3401264',
  userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
  committeeId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
  seasonKey: 2025,
  role: 'voorzitter' as const,
  startedOn: '2025-08-01',
  endedOn: null as null,
};

function makeProjector(manager: object) {
  const dataSource = { manager };
  return new CommitteeProjector(dataSource as never);
}

describe('CommitteeProjector', () => {
  it('projects a committee membership assignment', async () => {
    const entity = new CommitteeMembershipEntity();
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(entity),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = makeProjector({ getRepository: jest.fn().mockReturnValue(repository) });

    await expect(
      projector.projectMemberAssigned(
        assignedPayload,
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).resolves.toBe(entity);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
        seasonKey: 2025,
        startedOn: '2025-08-01',
        endedOn: null,
        role: 'voorzitter',
      }),
    );
  });

  it('ends a membership without deleting its history', async () => {
    const entity = Object.assign(new CommitteeMembershipEntity(), {
      id: '02ac256b-ce8f-44e9-8913-7569c3401264',
      seasonKey: 2025,
      startedOn: '2025-08-01',
      endedOn: null,
    });
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(entity),
      save: jest.fn().mockResolvedValue(entity),
      delete: jest.fn(),
    };
    const projector = makeProjector({ getRepository: jest.fn().mockReturnValue(repository) });

    await expect(
      projector.projectMemberRemoved(
        { membershipId: entity.id, removedOn: '2026-02-01' },
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).resolves.toBe(entity);

    expect(entity.endedOn).toBe('2026-02-01');
    expect(repository.save).toHaveBeenCalledWith(entity);
    expect(repository.delete).not.toHaveBeenCalled();
  });

  describe('handle() — EventsHandler routing', () => {
    it('routes CommitteeCreatedEvent to projectCommitteeSnapshot', async () => {
      const entity = new CommitteeEntity();
      const repository = {
        findOneBy: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue(entity),
        save: jest.fn().mockResolvedValue(entity),
      };
      const manager = { getRepository: jest.fn().mockReturnValue(repository) };
      const projector = makeProjector(manager);

      await projector.handle(new CommitteeCreatedEvent(snapshotPayload, { source: 'manual' }));

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Bestuur' }),
      );
    });

    it('routes CommitteeMemberAssignedEvent to projectMemberAssigned', async () => {
      const entity = new CommitteeMembershipEntity();
      const repository = {
        findOneBy: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue(entity),
        save: jest.fn().mockResolvedValue(entity),
      };
      const manager = { getRepository: jest.fn().mockReturnValue(repository) };
      const projector = makeProjector(manager);

      await projector.handle(
        new CommitteeMemberAssignedEvent(assignedPayload, { source: 'manual' }),
      );

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ seasonKey: 2025, role: 'voorzitter' }),
      );
    });

    it('routes CommitteeMemberRemovedEvent to projectMemberRemoved', async () => {
      const entity = Object.assign(new CommitteeMembershipEntity(), {
        id: assignedPayload.membershipId,
        seasonKey: 2025,
        startedOn: '2025-08-01',
        endedOn: null,
      });
      const repository = {
        findOneBy: jest.fn().mockResolvedValue(entity),
        save: jest.fn().mockResolvedValue(entity),
        delete: jest.fn(),
      };
      const manager = { getRepository: jest.fn().mockReturnValue(repository) };
      const projector = makeProjector(manager);

      await projector.handle(
        new CommitteeMemberRemovedEvent(
          { membershipId: assignedPayload.membershipId, removedOn: '2026-02-01' },
          { source: 'manual' },
        ),
      );

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ endedOn: expect.any(String) }),
      );
    });

    describe('idempotency — handle() twice produces same state', () => {
      it('projectCommitteeSnapshot upserts the same row on replay', async () => {
        const entity = Object.assign(new CommitteeEntity(), {
          id: snapshotPayload.committeeId,
          name: 'Bestuur',
        });
        const repository = {
          findOneBy: jest.fn().mockResolvedValue(entity),
          create: jest.fn(),
          save: jest.fn().mockResolvedValue(entity),
        };
        const manager = { getRepository: jest.fn().mockReturnValue(repository) };
        const projector = makeProjector(manager);
        const event = new CommitteeCreatedEvent(snapshotPayload, { source: 'manual' });

        await projector.handle(event);
        await projector.handle(event);

        expect(repository.save).toHaveBeenCalledTimes(2);
        expect(repository.create).not.toHaveBeenCalled();
      });

      it('projectMemberRemoved is idempotent — endedOn not reset once set', async () => {
        const entity = Object.assign(new CommitteeMembershipEntity(), {
          id: assignedPayload.membershipId,
          seasonKey: 2025,
          startedOn: '2025-08-01',
          endedOn: '2026-02-01',
        });
        const repository = {
          findOneBy: jest.fn().mockResolvedValue(entity),
          save: jest.fn().mockResolvedValue(entity),
          delete: jest.fn(),
        };
        const manager = { getRepository: jest.fn().mockReturnValue(repository) };
        const projector = makeProjector(manager);
        const event = new CommitteeMemberRemovedEvent(
          { membershipId: assignedPayload.membershipId, removedOn: '2026-03-01' },
          { source: 'manual' },
        );

        await projector.handle(event);
        await projector.handle(event);

        // endedOn already set — save called only once (first call no-op because endedOn !== null)
        expect(repository.save).not.toHaveBeenCalled();
      });
    });
  });
});
