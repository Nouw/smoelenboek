import { describe, expect, it, jest } from '@jest/globals';
import { EmailOutboxRepository } from './email-outbox.repository';

describe('EmailOutboxRepository', () => {
  it('requeues delivery failures and permanently fails attempt eight', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const repository = new EmailOutboxRepository({ getRepository: () => ({ update }) } as never);
    await repository.markDeliveryFailure({ id: 'message', attempts: 0 } as never, 'smtp unavailable');
    expect(update).toHaveBeenLastCalledWith({ id: 'message', status: 'sending' }, expect.objectContaining({ status: 'pending', attempts: 1, lastError: 'smtp unavailable' }));
    await repository.markDeliveryFailure({ id: 'message', attempts: 7 } as never, 'still unavailable');
    expect(update).toHaveBeenLastCalledWith({ id: 'message', status: 'sending' }, expect.objectContaining({ status: 'failed', attempts: 8 }));
  });

  it('only marks an email sent while it remains claimed', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const repository = new EmailOutboxRepository({ getRepository: () => ({ update }) } as never);
    await repository.markSent('message');
    expect(update).toHaveBeenCalledWith(
      { id: 'message', status: 'sending' },
      expect.objectContaining({ status: 'sent' }),
    );
  });

  it('cancels only unsent invitation and password reset messages using the caller transaction', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const repository = new EmailOutboxRepository({} as never);
    await repository.cancelPendingAccessMessages('user-id', { query } as never);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("'invitation', 'password_reset'"), ['user-id']);
    const sql = String(query.mock.calls[0]?.[0]);
    expect(sql).toContain("'pending', 'sending'");
    expect(sql).toContain("'cancelled'");
  });

  it('cancels a claimed access email when its user has left', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const query = jest.fn().mockResolvedValue([{ status: 'sending', active: false }]);
    const repository = new EmailOutboxRepository({ query, getRepository: () => ({ update }) } as never);
    await expect(repository.canDeliverAccessMessage({ id: 'message', messageType: 'invitation' } as never)).resolves.toBe(false);
    expect(update).toHaveBeenCalledWith({ id: 'message', status: 'sending' }, { status: 'cancelled' });
    expect(String(query.mock.calls[0]?.[0])).toContain('ui."leaveDate" IS NULL');
    expect(String(query.mock.calls[0]?.[0])).toContain('u."banned" = false');
    expect(String(query.mock.calls[0]?.[0])).not.toContain('ui."userId" IS NOT NULL');
  });

  it('delivers a claimed access email only while its user remains active', async () => {
    const query = jest.fn().mockResolvedValue([{ status: 'sending', active: true }]);
    const repository = new EmailOutboxRepository({ query } as never);
    await expect(repository.canDeliverAccessMessage({ id: 'message', messageType: 'password_reset' } as never)).resolves.toBe(true);
    query.mockResolvedValue([{ status: 'cancelled', active: true }]);
    await expect(repository.canDeliverAccessMessage({ id: 'message', messageType: 'password_reset' } as never)).resolves.toBe(false);
  });

  it('does not regenerate an invitation token after cancellation', async () => {
    const query = jest.fn().mockResolvedValue([{ status: 'cancelled', active: false }]);
    const repository = new EmailOutboxRepository({
      transaction: (callback: (manager: unknown) => unknown) => callback({ query }),
    } as never);
    const message = {
      id: 'message', messageType: 'invitation', relatedUserId: 'user-id',
      payload: { expiresAt: '2020-01-01T00:00:00.000Z' },
    } as never;

    await expect(repository.refreshExpiringInvitation(message)).resolves.toBeNull();
    expect(query).toHaveBeenCalledTimes(1);
    expect(String(query.mock.calls[0]?.[0])).toContain('FOR UPDATE OF o');
    expect(String(query.mock.calls[0]?.[0])).not.toContain('ui."userId" IS NOT NULL');
  });

  it('claims stale sending messages so worker crashes cannot strand mail', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const repository = new EmailOutboxRepository({ transaction: (callback: (manager: unknown) => unknown) => callback({ query }) } as never);
    await repository.claim();
    expect(query).toHaveBeenCalledWith(expect.stringContaining("interval '5 minutes'"), [20]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('FOR UPDATE SKIP LOCKED'), [20]);
  });

  it('returns claimed messages when PostgreSQL wraps UPDATE RETURNING rows with an affected count', async () => {
    const message = { id: '3adf40dc-09f2-4898-9bce-2a97945c25ca', status: 'sending' };
    const query = jest.fn().mockResolvedValue([[message], 1]);
    const repository = new EmailOutboxRepository({ transaction: (callback: (manager: unknown) => unknown) => callback({ query }) } as never);

    await expect(repository.claim()).resolves.toEqual([message]);
  });
});
