import { describe, expect, it, jest } from '@jest/globals';

import { TrpcHost } from './trpc.host';

describe('TrpcHost', () => {
  it('serves generated tRPC docs', async () => {
    const get = jest.fn();
    const use = jest.fn();
    const host = new TrpcHost(
      { create: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
    );
    jest
      .spyOn(
        host as unknown as Record<string, () => Promise<unknown>>,
        'importDocsGenerator',
      )
      .mockResolvedValue({
        collectRoutes: jest.fn().mockReturnValue([{ path: 'seasons.list' }]),
        generateDocsHtml: jest
          .fn()
          .mockReturnValue(
            '<html><title>Smoelenboek RPC Documentation</title>seasons.list</html>',
          ),
      } as never);

    host.applyMiddleware({
      getHttpAdapter: () => ({
        getInstance: () => ({ get, use }),
      }),
    } as never);

    const docsHandler = get.mock.calls[0]?.[1] as (
      req: unknown,
      res: { type: (contentType: string) => { send: (html: string) => void } },
    ) => Promise<void>;
    const send = jest.fn();
    const type = jest.fn().mockReturnValue({ send });

    await docsHandler({}, { type });

    expect(get).toHaveBeenCalledWith('/docs', expect.any(Function));
    expect(type).toHaveBeenCalledWith('html');
    expect(send).toHaveBeenCalledWith(
      expect.stringContaining('Smoelenboek RPC Documentation'),
    );
    expect(send).toHaveBeenCalledWith(expect.stringContaining('seasons.list'));
  });
});
