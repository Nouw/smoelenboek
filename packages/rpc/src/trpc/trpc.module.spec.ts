import { Test } from '@nestjs/testing';
import { describe, expect, it } from '@jest/globals';

import { TrpcHost } from './trpc.host';
import { TrpcModule } from './trpc.module';

describe('TrpcModule', () => {
  it('resolves TrpcHost with its auth and CQRS dependencies', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TrpcModule],
    }).compile();

    expect(moduleRef.get(TrpcHost)).toBeInstanceOf(TrpcHost);
  });
});
