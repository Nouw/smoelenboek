import { HttpException, HttpStatus } from '@nestjs/common';

export class NoCurrentSeasonException extends HttpException {
  constructor() {
    super('There is no current season active', HttpStatus.NOT_FOUND);
  }
}
