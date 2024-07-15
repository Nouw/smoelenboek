import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResetToken } from '../entities/reset-token.entity';

@Injectable()
export class ResetTokenPipe implements PipeTransform {
  constructor(
    @InjectRepository(ResetToken)
    private readonly repository: Repository<ResetToken>,
  ) {}

  transform(value: any): Promise<ResetToken | null> {
    return this.repository.findOne({
      where: { token: value },
      relations: { user: true },
    });
  }
}
