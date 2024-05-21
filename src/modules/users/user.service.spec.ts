import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';
import { Role } from '../model/role.enum';
import { Asset, Frequency, RequestDataSet } from '../model/asset.enum';
import { createMock } from '@golevelup/ts-jest';
import { USER_REPOSITORY } from '../../core/constants';

describe('UserService', () => {
  let userService: UsersService;

  const mockUsersRepository = {
    create: jest.fn().mockImplementation(() => Promise.resolve(mockUser)),
    findOne: jest.fn(),
  };

  const mockUserDto = {
    name: 'test',
    email: 'test@test.com',
    password: '123456',
    role: Role.quant,
  } as UserDto;

  const mockUser2Dto = {
    name: 'test2',
    email: 'test2@test.com',
    password: '123456',
    role: Role.quant,
  } as UserDto;

  const mockUser = {
    name: 'test',
    email: 'test@test.com',
    password: '123456',
    role: Role.quant,
    approvedDatasets: null,
    save: jest.fn(),
  };

  const mockUser2 = {
    name: 'test2',
    email: 'test2@test.com',
    password: '123456',
    role: Role.quant,
    approvedDatasets: [
      { symbol: Asset.BTC, frequencyInfo: [{ frequency: Frequency.daily }] },
    ],
    save: jest.fn(),
  };

  const mockDataSetRequest: RequestDataSet = {
    symbol: Asset.BTC,
    frequencyInfo: { frequency: Frequency.hourly },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USER_REPOSITORY,
          useValue: mockUsersRepository,
        },
      ],
    })
      .useMocker(createMock)
      .compile();

    userService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  it('should create user into userRepository', async () => {
    const createResponse = await userService.create(mockUserDto);
    expect(mockUsersRepository.create).toHaveBeenCalledWith(mockUserDto);
    expect(createResponse).toEqual(mockUser);
  });

  it('should add the dataset to the user account', async () => {
    mockUsersRepository.findOne.mockResolvedValueOnce(
      Promise.resolve(mockUser),
    );

    const response = await userService.addDataSet(
      mockUserDto.email,
      mockDataSetRequest,
    );
    expect(response).toEqual({
      ...mockUser,
      approvedDatasets: [
        {
          symbol: mockDataSetRequest.symbol,
          frequencyInfo: [mockDataSetRequest.frequencyInfo],
        },
      ],
    });
  });

  it('should append to the dataset to the user account', async () => {
    mockUsersRepository.findOne.mockResolvedValueOnce(
      Promise.resolve(mockUser2),
    );
    const response = await userService.addDataSet(
      mockUser2Dto.email,
      mockDataSetRequest,
    );
    expect(response).toEqual({
      ...mockUser2,
      approvedDatasets: [
        {
          symbol: Asset.BTC,
          frequencyInfo: [
            { frequency: Frequency.daily },
            { frequency: Frequency.hourly },
          ],
        },
      ],
    });
  });
});
