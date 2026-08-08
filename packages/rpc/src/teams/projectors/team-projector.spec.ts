import { describe, expect, it, jest } from '@jest/globals';

import { TeamMembershipEntity } from '../entities/team-membership.entity';
import { TeamEntity } from '../entities/team.entity';
import {
  TeamCreatedEvent,
  TeamMemberAssignedEvent,
  TeamMemberRemovedEvent,
} from '../events/team-events';
import { TeamProjector } from './team-projector';

const snapshotPayload = {
  teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
  name: 'Heren 1',
  category: 'men' as const,
  imageUrl: 'https://cdn.example.com/team.png',
  archivedAt: null,
};

const assignedPayload = {
  membershipId: '02ac256b-ce8f-44e9-8913-7569c3401264',
  userId: 'af9b8be8-b5a5-4d05-8965-e17337f3a0f0',
  teamId: '521ccf21-351e-41bd-a06b-8da3af4599d4',
  seasonKey: 2025,
  role: 'setter' as const,
  startedOn: '2025-08-01',
  endedOn: null as null,
};

function makeProjector(manager: object) {
  const dataSource = { manager };
  return new TeamProjector(dataSource as never);
}

describe('TeamProjector', () => {
  it('projects a team snapshot with imageUrl', async () => {
    const entity = new TeamEntity();
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(entity),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = new TeamProjector({ manager: null } as never);

    await expect(
      projector.projectTeamSnapshot(
        snapshotPayload,
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).resolves.toBe(entity);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Heren 1',
        category: 'men',
        imageUrl: 'https://cdn.example.com/team.png',
        archivedAt: null,
      }),
    );
  });

  it('projects a team membership assignment', async () => {
    const entity = new TeamMembershipEntity();
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(entity),
      save: jest.fn().mockResolvedValue(entity),
    };
    const projector = new TeamProjector({ manager: null } as never);

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
        role: 'setter',
      }),
    );
  });

  it('removes a membership from the roster projection', async () => {
    const entity = Object.assign(new TeamMembershipEntity(), {
      id: '02ac256b-ce8f-44e9-8913-7569c3401264',
      seasonKey: 2025,
      startedOn: '2025-08-01',
      endedOn: null,
    });
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(entity),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const projector = new TeamProjector({ manager: null } as never);

    await expect(
      projector.projectMemberRemoved(
        { membershipId: entity.id },
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).resolves.toBe(entity);

    expect(repository.delete).toHaveBeenCalledWith({ id: entity.id });
  });

  it('treats replay of a missing membership removal as a no-op', async () => {
    const repository = {
      findOneBy: jest.fn().mockResolvedValue(null),
      delete: jest.fn(),
    };

    await expect(
      new TeamProjector({ manager: null } as never).projectMemberRemoved(
        { membershipId: '02ac256b-ce8f-44e9-8913-7569c3401264' },
        { getRepository: jest.fn().mockReturnValue(repository) } as never,
      ),
    ).resolves.toBeNull();
    expect(repository.delete).not.toHaveBeenCalled();
  });

  describe('handle() — EventsHandler routing', () => {
    it('routes TeamCreatedEvent to projectTeamSnapshot', async () => {
      const entity = new TeamEntity();
      const repository = {
        findOneBy: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue(entity),
        save: jest.fn().mockResolvedValue(entity),
      };
      const manager = { getRepository: jest.fn().mockReturnValue(repository) };
      const projector = makeProjector(manager);

      await projector.handle(new TeamCreatedEvent(snapshotPayload, { source: 'manual', actorUserId: 'a' }));

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Heren 1' }),
      );
    });

    it('routes TeamMemberAssignedEvent to projectMemberAssigned', async () => {
      const entity = new TeamMembershipEntity();
      const repository = {
        findOneBy: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockReturnValue(entity),
        save: jest.fn().mockResolvedValue(entity),
      };
      const manager = { getRepository: jest.fn().mockReturnValue(repository) };
      const projector = makeProjector(manager);

      await projector.handle(new TeamMemberAssignedEvent(assignedPayload, { source: 'manual', actorUserId: 'a' }));

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ seasonKey: 2025, role: 'setter' }),
      );
    });

    it('routes TeamMemberRemovedEvent to projectMemberRemoved', async () => {
      const entity = Object.assign(new TeamMembershipEntity(), { id: assignedPayload.membershipId });
      const repository = {
        findOneBy: jest.fn().mockResolvedValue(entity),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      const manager = { getRepository: jest.fn().mockReturnValue(repository) };
      const projector = makeProjector(manager);

      await projector.handle(new TeamMemberRemovedEvent({ membershipId: assignedPayload.membershipId }, { source: 'manual', actorUserId: 'a' }));

      expect(repository.delete).toHaveBeenCalledWith({ id: assignedPayload.membershipId });
    });

    describe('idempotency — handle() twice produces same state', () => {
      it('projectTeamSnapshot upserts the same row on replay', async () => {
        const entity = Object.assign(new TeamEntity(), { id: snapshotPayload.teamId, name: 'Heren 1' });
        const repository = {
          findOneBy: jest.fn().mockResolvedValue(entity),
          create: jest.fn(),
          save: jest.fn().mockResolvedValue(entity),
        };
        const manager = { getRepository: jest.fn().mockReturnValue(repository) };
        const projector = makeProjector(manager);
        const event = new TeamCreatedEvent(snapshotPayload, { source: 'manual', actorUserId: 'a' });

        await projector.handle(event);
        await projector.handle(event);

        expect(repository.save).toHaveBeenCalledTimes(2);
        // create never called because existing row found both times
        expect(repository.create).not.toHaveBeenCalled();
      });

      it('projectMemberRemoved is idempotent — second call is a no-op', async () => {
        const entity = Object.assign(new TeamMembershipEntity(), { id: assignedPayload.membershipId });
        const findOneBy = jest.fn()
          .mockResolvedValueOnce(entity) // first call: found
          .mockResolvedValueOnce(null);  // second call: already deleted
        const deleteCall = jest.fn().mockResolvedValue({ affected: 1 });
        const repository = { findOneBy, delete: deleteCall };
        const manager = { getRepository: jest.fn().mockReturnValue(repository) };
        const projector = makeProjector(manager);
        const event = new TeamMemberRemovedEvent({ membershipId: assignedPayload.membershipId }, { source: 'manual', actorUserId: 'a' });

        await projector.handle(event);
        await projector.handle(event);

        expect(deleteCall).toHaveBeenCalledTimes(1);
      });
    });
  });
});
