import { Module } from '@nestjs/common';
import { PropollService } from './propoll.service';
import { PropollController } from './propoll.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Propoll } from './entities/propoll.entity';
import { PropollOption } from './entities/propoll-option.entity';
import { PropollVote } from './entities/propoll-vote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Propoll, PropollOption, PropollVote])],
  controllers: [PropollController],
  providers: [PropollService],
})
export class PropollModule {}
