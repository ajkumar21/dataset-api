import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './request.service';
import { UsersService } from '../users/users.service';
import { Asset, Frequency } from '../model/asset.enum';
import { Role } from '../model/role.enum';
import { REQUEST_REPOSITORY } from '../../core/constants';

describe('RequestsService', () => {
  let requestsService: RequestsService;

  const mockRequests = [
    {
      id: '1',
      email: 'test@test.com',
      symbol: Asset.BTC,
      frequency: Frequency.daily,
    },
    {
      id: '2',
      email: 'test@test.com',
      symbol: Asset.BTC,
      frequency: Frequency.hourly,
    },
  ];

  const mockUser = {
    name: 'test',
    email: 'test@test.com',
    role: Role.quant,
    approvedDataSets: [{ symbol: Asset.BTC, frequencies: [Frequency.daily] }],
  };

  const mockRequestsRepository = {
    create: jest.fn((dto) => {
      return { id: Date.now(), ...dto };
    }),
    findAll: jest.fn(() => mockRequests),
    findOne: jest.fn(),
  };

  const mockUsersService = {
    addDataSet: jest.fn().mockResolvedValue(mockUser),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestsService,
        UsersService,
        {
          provide: REQUEST_REPOSITORY,
          useValue: mockRequestsRepository,
        },
      ],
    })
      .overrideProvider(UsersService)
      .useValue(mockUsersService)
      .compile();

    requestsService = module.get<RequestsService>(RequestsService);
  });

  it('should be defined', () => {
    expect(requestsService).toBeDefined();
  });

  it('should return the asset-frequency combinations', () => {
    expect(requestsService.getDatasetMetadata()).toEqual({
      bitcoin: {
        name: 'Bitcoin',
        frequencies: [Frequency.hourly, Frequency.daily, Frequency.monthly],
      },
      ethereum: { name: 'Ethereum', frequencies: [Frequency.daily] },
    });
  });

  it('should create a request', async () => {
    const mockRequest = { symbol: Asset.BTC, frequency: Frequency.daily };
    const email = 'test@test.com';
    expect(await requestsService.create(mockRequest, email)).toEqual({
      id: expect.any(Number),
      email,
      ...mockRequest,
    });
  });

  it('should return all requests', async () => {
    expect(await requestsService.getAllRequests()).toEqual(mockRequests);
    expect(mockRequestsRepository.findAll).toHaveBeenCalled();
  });

  it('should approve a request', async () => {
    const id = '1';
    const mockDestroyfn = jest.fn();
    mockRequestsRepository.findOne.mockResolvedValue({
      dataValues: mockRequests[0],
      destroy: mockDestroyfn,
    });
    await requestsService.approveRequest(id);
    expect(mockRequestsRepository.findOne).toHaveBeenCalled();
    expect(mockDestroyfn).toHaveBeenCalled();
  });

  it('should refuse a request', async () => {
    const id = '1';
    const mockDestroyfn = jest.fn();
    mockRequestsRepository.findOne.mockResolvedValue({
      dataValues: mockRequests[0],
      destroy: mockDestroyfn,
    });
    await requestsService.refuseRequest(id);
    expect(mockRequestsRepository.findOne).toHaveBeenCalled();
    expect(mockDestroyfn).toHaveBeenCalled();
  });
});
