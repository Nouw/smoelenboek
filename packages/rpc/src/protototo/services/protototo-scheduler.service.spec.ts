import { describe, expect, it, jest } from '@jest/globals';

import { ProtototoSchedulerService } from './protototo-scheduler.service';

describe('ProtototoSchedulerService', () => {
  it('registers the configured interval and removes it on shutdown', () => {
    const registry = {
      addInterval: jest.fn(),
      doesExist: jest.fn().mockReturnValue(true),
      deleteInterval: jest.fn(),
    };
    const service = new ProtototoSchedulerService(
      registry as never,
      { get: jest.fn().mockReturnValue('900000') } as never,
      { syncStarted: jest.fn() } as never,
    );
    service.onModuleInit();
    expect(registry.addInterval).toHaveBeenCalledWith(
      'protototo-result-sync',
      expect.anything(),
    );
    service.onModuleDestroy();
    expect(registry.deleteInterval).toHaveBeenCalledWith(
      'protototo-result-sync',
    );
    clearInterval(registry.addInterval.mock.calls[0]?.[1] as NodeJS.Timeout);
  });

  it('does not overlap polls', async () => {
    let finish: (() => void) | undefined;
    const syncStarted = jest.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const service = new ProtototoSchedulerService(
      {} as never,
      {} as never,
      { syncStarted } as never,
    );
    const first = service.pollNow();
    await service.pollNow();
    expect(syncStarted).toHaveBeenCalledTimes(1);
    finish?.();
    await first;
  });
});
