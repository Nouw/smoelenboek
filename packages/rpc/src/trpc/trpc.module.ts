import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AuthModule } from '../auth/auth.module';
import { TrpcHost } from './trpc.host';

@Module({
  imports: [AuthModule, CqrsModule],
  providers: [TrpcHost],
  exports: [TrpcHost],
})
export class TrpcModule {}
