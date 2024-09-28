import { Module } from '@nestjs/common';
import { NevoboService } from './nevobo.service';
import { NevoboController } from './nevobo.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [NevoboController],
  providers: [NevoboService],
  exports: [NevoboService],
})
export class NevoboModule {}
