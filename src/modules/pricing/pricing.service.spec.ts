import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from './pricing.service';
import { RequestsService } from '../accessRequest/request.service';
import { HttpService } from '@nestjs/axios';
import { Asset, Frequency } from '../model/asset.enum';
import { of, throwError } from 'rxjs';
import { mockCoinAPIData, monthlyResponseData } from './mockData/mockAPIData';

describe('PricingService', () => {
  let service: PricingService;
  const mockRequestsService = {
    getSpecificDatasetMetadata: jest.fn(),
  };
  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricingService, RequestsService, HttpService],
    })
      .overrideProvider(RequestsService)
      .useValue(mockRequestsService)
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .compile();

    service = module.get<PricingService>(PricingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return data from endpoint', async () => {
    jest
      .spyOn(mockRequestsService, 'getSpecificDatasetMetadata')
      .mockReturnValueOnce({
        name: 'Ethereum',
        frequencies: [Frequency.daily],
      });

    jest.spyOn(mockHttpService, 'get').mockReturnValueOnce(of(mockCoinAPIData));
    expect(
      await service.getData(Asset.ETH, Frequency.daily, [
        {
          symbol: Asset.ETH,
          frequencyInfo: [{ frequency: Frequency.daily }],
        },
      ]),
    ).toEqual(mockCoinAPIData.data);
  });
  it('should return monthly data from endpoint when monthly frequency is passed', async () => {
    jest
      .spyOn(mockRequestsService, 'getSpecificDatasetMetadata')
      .mockReturnValueOnce({
        name: 'Bitcoin',
        frequencies: [Frequency.monthly],
      });

    jest.spyOn(mockHttpService, 'get').mockReturnValueOnce(of(mockCoinAPIData));
    expect(
      await service.getData(Asset.BTC, Frequency.monthly, [
        {
          symbol: Asset.BTC,
          frequencyInfo: [{ frequency: Frequency.monthly }],
        },
      ]),
    ).toEqual(monthlyResponseData);
  });
  it('should return bad request exception if invalid asset frequency combination passed', async () => {
    jest
      .spyOn(mockRequestsService, 'getSpecificDatasetMetadata')
      .mockReturnValueOnce({
        name: 'Ethereum',
        frequencies: [Frequency.daily],
      });
    await expect(
      service.getData(Asset.ETH, Frequency.monthly, null),
    ).rejects.toThrow('Invalid asset frequency combination');
  });
  it('should return bad request exception if invalid asset passed', async () => {
    await expect(
      service.getData('INVALID ASSET' as Asset, Frequency.monthly, null),
    ).rejects.toThrow('Invalid asset class');
  });
  it('should return forbidden exception if trial has finished', async () => {
    const expiredDate = new Date(2020, 1, 1);
    jest
      .spyOn(mockRequestsService, 'getSpecificDatasetMetadata')
      .mockReturnValueOnce({
        name: 'Bitcoin',
        frequencies: [Frequency.hourly, Frequency.daily, Frequency.monthly],
      });
    await expect(
      service.getData(Asset.BTC, Frequency.daily, [
        {
          symbol: Asset.BTC,
          frequencyInfo: [
            { frequency: Frequency.daily, expiryDate: expiredDate },
          ],
        },
      ]),
    ).rejects.toThrow(
      'Access to asset frequency combination has expired. Please request for access',
    );
  });
  it('should return forbidden exception if quant does not have approval for asset-frequnecy combination', async () => {
    jest
      .spyOn(mockRequestsService, 'getSpecificDatasetMetadata')
      .mockReturnValueOnce({
        name: 'Bitcoin',
        frequencies: [Frequency.hourly, Frequency.daily, Frequency.monthly],
      });
    await expect(
      service.getData(Asset.BTC, Frequency.daily, [
        {
          symbol: Asset.BTC,
          frequencyInfo: [{ frequency: Frequency.hourly }],
        },
      ]),
    ).rejects.toThrow(
      'You do not have access to this asset-frequency combination. Please request access',
    );
  });
  it('should return service unavailable exception if http endpoint fails', async () => {
    jest
      .spyOn(mockRequestsService, 'getSpecificDatasetMetadata')
      .mockReturnValueOnce({
        name: 'Bitcoin',
        frequencies: [Frequency.hourly, Frequency.daily, Frequency.monthly],
      });

    const error = {
      status: 500,
      message: 'Internal error',
    };

    jest.spyOn(mockHttpService, 'get').mockReturnValue(throwError(() => error));

    await expect(
      service.getData(Asset.BTC, Frequency.daily, [
        {
          symbol: Asset.BTC,
          frequencyInfo: [{ frequency: Frequency.daily }],
        },
      ]),
    ).rejects.toThrow('HTTP error with API endpoint');
  });
});
