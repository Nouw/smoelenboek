import { Module } from '@nestjs/common';
import { ProtototoService } from './protototo.service';
import { ProtototoController } from './protototo.controller';

@Module({
  controllers: [ProtototoController],
  providers: [ProtototoService],
})
export class ProtototoModule {}
