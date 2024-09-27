import { Module } from '@nestjs/common';
import { ProtototoService } from './protototo.service';
import { ProtototoController } from './protototo.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProtototoSeason } from './entities/protototo-season.entity';
import { ProtototoMatch } from './entities/protototo-match.entity';
import { NevoboModule } from 'src/nevobo/nevobo.module';
import { ProtototoMatchResult } from './entities/protototo-result.entity';
import { ProtototoPrediction } from './entities/protototo-prediction.entity';

@Module({
  imports: [
    NevoboModule,
    TypeOrmModule.forFeature([
      ProtototoSeason,
      ProtototoMatch,
      ProtototoMatchResult,
      ProtototoPrediction,
    ]),
  ],
  controllers: [ProtototoController],
  providers: [ProtototoService],
})
export class ProtototoModule {}
