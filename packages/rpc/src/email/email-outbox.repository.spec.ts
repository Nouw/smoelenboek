import { describe, expect, it, jest } from '@jest/globals';
import { EmailOutboxRepository } from './email-outbox.repository';

describe('EmailOutboxRepository', () => {
  it('requeues delivery failures and permanently fails attempt eight', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const repository = new EmailOutboxRepository({ getRepository: () => ({ update }) } as never);
    await repository.markDeliveryFailure({ id: 'message', attempts: 0 } as never, 'smtp unavailable');
    expect(update).toHaveBeenLastCalledWith('message', expect.objectContaining({ status: 'pending', attempts: 1, lastError: 'smtp unavailable' }));
    await repository.markDeliveryFailure({ id: 'message', attempts: 7 } as never, 'still unavailable');
    expect(update).toHaveBeenLastCalledWith('message', expect.objectContaining({ status: 'failed', attempts: 8 }));
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
