import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './marketCap.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { MARKETCAP_REPOSITORY } from 'src/core/constants';

describe('SchedulerService', () => {
  let service: SchedulerService;

  const mockMarketCapRepository = {
    create: jest.fn(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        HttpService,
        {
          provide: MARKETCAP_REPOSITORY,
          useValue: mockMarketCapRepository,
        },
      ],
    })
      .overrideProvider(HttpService)
      .useValue(mockHttpService)
      .compile();

    service = module.get<SchedulerService>(SchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call get endpoint to retrieve market cap data', async () => {
    const id = '1';
    const marketCapUsd = '1';
    const result = { data: { data: [{ id, marketCapUsd }] } };
    jest.spyOn(mockHttpService, 'get').mockImplementationOnce(() => of(result));

    await service.getMarketCap();

    expect(mockHttpService.get).toHaveBeenCalled();
    expect(mockMarketCapRepository.create).toHaveBeenCalledWith({
      date: expect.any(String),
      name: id,
      marketCap: marketCapUsd,
    });
  });
});
