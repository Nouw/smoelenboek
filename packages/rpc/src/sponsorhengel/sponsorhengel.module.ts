import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { SponsorhengelEntity } from './entities/sponsorhengel.entity';
import { GetSponsorhengelMetaHandler } from './queries/get-sponsorhengel-meta.handler';
import { SponsorhengelRepository } from './repositories/sponsorhengel.repository';
import { SponsorhengelController } from './sponsorhengel.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SponsorhengelEntity]), AuthModule, MediaModule],
  controllers: [SponsorhengelController],
  providers: [SponsorhengelRepository, GetSponsorhengelMetaHandler],
})
export class SponsorhengelModule {}
