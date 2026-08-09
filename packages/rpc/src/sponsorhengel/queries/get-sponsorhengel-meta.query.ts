import { IQuery } from '@nestjs/cqrs';

export type SponsorhengelMetaDto = {
  originalName: string;
  updatedAt: Date;
} | null;

export class GetSponsorhengelMetaQuery implements IQuery {}
