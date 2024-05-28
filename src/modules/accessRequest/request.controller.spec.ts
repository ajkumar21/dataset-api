import { Test, TestingModule } from '@nestjs/testing';
import { RequestsController } from './request.controller';
import { RequestsService } from './request.service';
import { Asset, Frequency } from '../model/asset.enum';
import { BadRequestException } from '@nestjs/common';

describe('RequestsController', () => {
  let requestsController: RequestsController;

  const mockDatasetMetadata = [
    {
      BTC: {
        name: 'Bitcoin',
        frequencies: [Frequency.hourly, Frequency.daily, Frequency.monthly],
      },
    },
    { ETH: { name: 'Ethereum', frequencies: [Frequency.daily] } },
  ];

  const mockRequests = {};

  const mockRequestsService = {
    getDatasetMetadata: jest.fn(() => mockDatasetMetadata),
    create: jest.fn(({ symbol, frequency }, email) => {
      return { id: Date.now(), email, symbol, frequencies: [frequency] };
    }),
    getAllRequests: jest.fn(() => mockRequests),
    approveRequest: jest.fn(),
    refuseRequest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [RequestsService],
    })
      .overrideProvider(RequestsService)
      .useValue(mockRequestsService)
      .compile();

    requestsController = module.get<RequestsController>(RequestsController);
  });

  it('should be defined', () => {
    expect(requestsController).toBeDefined();
  });

  it('should return all the available dataset metadata', () => {
    expect(requestsController.getMetadata()).toEqual(mockDatasetMetadata);
  });

  it('should allow access requests to datasets', async () => {
    const mockEmail = 'test@test.com';
    const mockRequest = {
      symbol: Asset.BTC,
      frequency: Frequency.daily,
    };
    expect(
      await requestsController.requestAccessToDataset(mockRequest, {
        user: { payload: { email: mockEmail } },
      }),
    ).toEqual({
      id: expect.any(Number),
      email: mockEmail,
      symbol: mockRequest.symbol,
      frequencies: [mockRequest.frequency],
    });
  });

  it('should return all requests', () => {
    expect(requestsController.getRequests()).toEqual(mockRequests);
  });

  it('should approve a specific request', () => {
    requestsController.approveRequest('1');
    expect(mockRequestsService.approveRequest).toHaveBeenCalled();
  });

  it('should refuse a specific request', () => {
    requestsController.refuseRequest('1');
    expect(mockRequestsService.refuseRequest).toHaveBeenCalled();
  });
});
