import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { OracleModule } from 'src/oracle/oracle.module';
import { MailModule } from '../mail/mail.module';
import { ResetToken } from '../auth/entities/reset-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ResetToken]),
    OracleModule,
    MailModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
