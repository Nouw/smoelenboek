import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { format } from 'date-fns';

@Injectable()
export class NevoboService {
  constructor(private readonly httpService: HttpService) {}

  async teams() {
    const res = await firstValueFrom(
      this.httpService.get(
        'https://api.nevobo.nl/competitie/teams?vereniging=/relatiebeheer/verenigingen/ckl9y0t',
      ),
    );

    return res.data;
  }

  async matches(team: string) {
    const res = await firstValueFrom(
      this.httpService.get(
        `https://api.nevobo.nl/competitie/wedstrijden?order[begintijd]=asc&team=${team}&datum[after]=${format(new Date(), 'yyyy-MM-dd')}`,
      ),
    );

    return res.data;
  }

  async team(id: string) {
    const res = await firstValueFrom(
      this.httpService.get(`
    https://api.nevobo.nl${decodeURI(id)}`),
    );

    return res.data;
  }

  findOne(id: number) {
    return `This action returns a #${id} nevobo`;
  }
  remove(id: number) {
    return `This action removes a #${id} nevobo`;
  }
}
