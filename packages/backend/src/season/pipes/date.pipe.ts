import { Injectable, PipeTransform } from '@nestjs/common';
import { parseISO } from 'date-fns';

@Injectable()
export class DatePipe implements PipeTransform {
  transform(value: any): Date {
    return parseISO(value);
  }
}
