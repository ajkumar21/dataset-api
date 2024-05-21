import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { catchError, firstValueFrom } from 'rxjs';
import { RequestsService } from '../../modules/accessRequest/request.service';
import { Asset, DataSet, Frequency } from '../../modules/model/asset.enum';

type coinApiPriceInfoType = { priceUsd: string; time: number; date: string };

type coinApiResponseType = {
  data: coinApiPriceInfoType[];
};

@Injectable()
export class PricingService {
  constructor(
    private readonly requestService: RequestsService,
    private readonly httpService: HttpService,
  ) {}

  async getData(
    asset: Asset,
    frequency: Frequency,
    approvedDatasets: DataSet[],
  ) {
    const validFrequencies =
      this.requestService.getSpecificDatasetMetadata(asset);
    if (validFrequencies) {
      if (!validFrequencies.frequencies.includes(frequency)) {
        throw new BadRequestException('Invalid asset frequency combination');
      }
    } else {
      throw new BadRequestException('Invalid asset class');
    }
    if (approvedDatasets) {
      const dataset = approvedDatasets.find(
        (dataset) => dataset.symbol === asset,
      );
      if (dataset) {
        const userFrequencyInfo = dataset.frequencyInfo.find(
          (frequencyDetail) => frequencyDetail.frequency === frequency,
        );

        if (userFrequencyInfo) {
          if (
            userFrequencyInfo.expiryDate &&
            new Date(userFrequencyInfo.expiryDate).getDate() < Date.now()
          ) {
            throw new ForbiddenException(
              'Access to asset frequency combination has expired. Please request for access',
            );
          }
          if (frequency === Frequency.monthly) {
            const { data }: { data: coinApiResponseType } =
              await firstValueFrom(
                this.httpService
                  .get(
                    `http://api.coincap.io/v2/assets/${asset}/history?interval=d1`,
                  )
                  .pipe(
                    catchError(() => {
                      throw new ServiceUnavailableException(
                        'HTTP error with API endpoint',
                      );
                    }),
                  ),
              );
            const groupedData = new Map<string, coinApiPriceInfoType[]>();
            data.data.forEach((dayData) => {
              const dateOfSet = new Date(dayData.date);
              const month = dateOfSet.getMonth();
              const year = dateOfSet.getFullYear();
              let groupDate = new Date(year, month);
              groupDate = new Date(
                groupDate.getTime() - groupDate.getTimezoneOffset() * 60000,
              );
              const groupDateStr = groupDate.toISOString();
              const currData: coinApiPriceInfoType[] =
                groupedData.get(groupDateStr);

              groupedData.set(
                groupDateStr,
                currData ? [...currData, dayData] : [dayData],
              );
            });
            const responseData = [];

            groupedData.forEach((monthData, date) => {
              let monthAggData;
              if (monthData.length === 1) {
                monthAggData = {
                  ...monthData[0],
                  time: new Date(date).getTime(),
                  date,
                };
              } else {
                monthAggData = monthData.reduce((acc, currVal) => {
                  return {
                    priceUsd: (
                      parseFloat(acc.priceUsd) + parseFloat(currVal.priceUsd)
                    ).toString(),
                    time: new Date(date).getTime(),
                    date,
                  };
                });
              }
              responseData.push({
                ...monthAggData,
                priceUsd: (
                  parseFloat(monthAggData.priceUsd) / monthData.length
                ).toString(),
              });
            });

            return { data: responseData };
          }

          const { data } = await firstValueFrom(
            this.httpService
              .get(
                `http://api.coincap.io/v2/assets/${asset}/history?interval=${frequency}`,
              )
              .pipe(
                catchError(() => {
                  throw new ServiceUnavailableException(
                    'HTTP error with API endpoint',
                  );
                }),
              ),
          );
          return data;
        }
      }
    }

    throw new ForbiddenException(
      'You do not have access to this asset-frequency combination. Please request access',
    );
  }
}
