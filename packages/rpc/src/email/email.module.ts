import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailOutboxProcessor } from './email-outbox.processor';
import { EmailOutboxRepository } from './email-outbox.repository';
import { EmailOutboxEntity } from './entities/email-outbox.entity';
import { SmtpEmailSender } from './smtp-email.sender';

@Module({
  imports: [TypeOrmModule.forFeature([EmailOutboxEntity])],
  providers: [EmailOutboxRepository, SmtpEmailSender, EmailOutboxProcessor],
  exports: [EmailOutboxRepository],
})
export class EmailModule {}
