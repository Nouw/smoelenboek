import { Module } from '@nestjs/common';
import { ProtototoService } from './protototo.service';
import { ProtototoController } from './protototo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProtototoSeason } from './entities/protototo-season.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProtototoSeason])],
  controllers: [ProtototoController],
  providers: [ProtototoService],
})
export class ProtototoModule {}
