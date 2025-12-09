import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { Team } from '../entities/team.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { OracleService } from '../../oracle/oracle.service';

@Injectable()
export class SyncPhotosListener {
  private readonly logger = new Logger(SyncPhotosListener.name);

  constructor(
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
    private readonly oracleService: OracleService,
  ) {}

  @OnEvent('teams.sync-photos')
  async handleSyncPhotos() {
    this.logger.log('Starting syncing of teams photos...');

    const res = await fetch(
      'https://www.usvprotos.nl/wp-json/api/smoelenboek/images',
    );
    const images: string[] = await res.json();

    this.logger.debug(`Received ${images.length} images`);

    for (const imageUrl of images) {
      const parts = imageUrl.split('/');
      let filename = parts[parts.length - 1];
      filename = filename.split('.')[0];
      const filenameParts = filename.split('-');
      const teamName = `${filenameParts[0]} ${filenameParts[1]}`;

      const team = await this.teamsRepository.findOne({
        where: { name: teamName },
      });

      if (!team) {
        this.logger.warn(
          'The image url is not correctly formated, should be' +
            ` {gender}-{id} (${imageUrl})`,
        );
        continue;
      }

      const res = await fetch(imageUrl);
      const arrayBuffer = await res.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      const folder = 'team';
      const path = await this.oracleService.uploadBuffer(
        imageBuffer,
        'jpg',
        folder,
      );

      team.image = `${folder}/${path}`;

      await this.teamsRepository.save(team);
    }

    this.logger.log('Finished syncing team photos');
  }
}
