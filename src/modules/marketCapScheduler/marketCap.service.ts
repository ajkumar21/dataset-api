import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { catchError, firstValueFrom } from 'rxjs';
import { Asset } from '../model/asset.enum';
import { MARKETCAP_REPOSITORY } from '../../core/constants';
import { MarketCap } from './marketCap.entity';

@Injectable()
export class SchedulerService {
  constructor(
    @Inject(MARKETCAP_REPOSITORY)
    private readonly marketCapRepository: typeof MarketCap,
    private readonly httpService: HttpService,
  ) {}

  @Cron('0 0 20 * * *')
  async getMarketCap() {
    const ids = Object.values(Asset).join(',');
    const { data } = await firstValueFrom(
      this.httpService.get(`api.coincap.io/v2/assets?ids=${ids}`).pipe(
        catchError(() => {
          throw 'HTTP error with API endpoint';
        }),
      ),
    );
    data.data.map((assetData) => {
      this.marketCapRepository.create({
        date: Date.now().toString(),
        name: assetData.id,
        marketCap: assetData.marketCapUsd,
      });
    });
  }
}
