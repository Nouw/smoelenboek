import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { createTypeOrmOptions } from './database/typeorm.config';
import { TrpcModule } from './trpc/trpc.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(createTypeOrmOptions()),
    CqrsModule.forRoot(),
    AuthModule,
    UsersModule,
    TrpcModule,
  ],
})
export class AppModule {}
