import { Module } from '@nestjs/common';

import { TrpcHost } from './trpc.host';

@Module({
  providers: [TrpcHost],
  exports: [TrpcHost],
})
export class TrpcModule {}
