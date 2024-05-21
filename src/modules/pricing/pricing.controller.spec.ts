import { Test, TestingModule } from '@nestjs/testing';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { Asset, Frequency } from '../model/asset.enum';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('PricingController', () => {
  let controller: PricingController;

  const mockPricingService = {
    getData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricingService],
      controllers: [PricingController],
    })
      .overrideProvider(PricingService)
      .useValue(mockPricingService)
      .compile();

    controller = module.get<PricingController>(PricingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get data from pricing service', async () => {
    const response = { data: {} };
    const userRequest = { user: { payload: { approvedDatasets: [] } } };
    mockPricingService.getData.mockResolvedValueOnce(response);
    expect(
      await controller.getData(Asset.BTC, Frequency.hourly, userRequest),
    ).toEqual(response);
  });

  it('should throw bad request exception if pricing service throws bad request exception', () => {
    const userRequest = { user: { payload: { approvedDatasets: [] } } };
    const mockError = new BadRequestException(
      'Invalid asset frequency combination',
    );
    jest.spyOn(mockPricingService, 'getData').mockImplementationOnce(() => {
      throw mockError;
    });
    expect(() =>
      controller.getData(Asset.BTC, Frequency.hourly, userRequest),
    ).toThrow(mockError);
  });

  it('should throw forbidden exception if pricing service throws forbidden exception', () => {
    const userRequest = { user: { payload: { approvedDatasets: [] } } };
    const mockError = new ForbiddenException(
      'Invalid asset frequency combination',
    );
    jest.spyOn(mockPricingService, 'getData').mockImplementationOnce(() => {
      throw mockError;
    });
    expect(() =>
      controller.getData(Asset.BTC, Frequency.hourly, userRequest),
    ).toThrow(mockError);
  });
});
