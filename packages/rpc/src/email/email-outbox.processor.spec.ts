import { describe, expect, it, jest } from '@jest/globals';
import { EmailOutboxProcessor } from './email-outbox.processor';

describe('EmailOutboxProcessor', () => {
  it('skips a claimed invitation when the account becomes inactive before delivery', async () => {
    const message = { id: 'message', messageType: 'invitation', attempts: 0 };
    const refreshExpiringInvitation = jest.fn().mockResolvedValue(message);
    const markSent = jest.fn().mockResolvedValue(undefined);
    const send = jest.fn().mockResolvedValue(undefined);
    const processor = new EmailOutboxProcessor({
      claim: jest.fn().mockResolvedValue([message]),
      canDeliverAccessMessage: jest.fn().mockResolvedValue(false),
      refreshExpiringInvitation,
      markSent,
    } as never, { send } as never);

    await processor.drain();

    expect(refreshExpiringInvitation).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(markSent).not.toHaveBeenCalled();
  });
});
