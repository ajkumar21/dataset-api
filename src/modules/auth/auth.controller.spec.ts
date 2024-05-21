import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '../model/role.enum';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn((req) => req),
    create: jest.fn((dto) => {
      return { id: Date.now(), ...dto };
    }),
  };

  const mockUser: User = {
    dataValues: {
      name: 'test',
      email: 'test@test.com',
      password: '123456',
      role: Role.quant,
      approvedDatasets: null,
    },
  } as User;

  const mockUserService = {
    findOneByEmail: jest.fn(() => mockUser),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService, UsersService],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .overrideProvider(UsersService)
      .useValue(mockUserService)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.login with user credentials', async () => {
    const loginReq = {
      user: { username: mockUser.email, password: mockUser.password },
    };
    await controller.login(loginReq);
    expect(mockAuthService.login).toHaveBeenCalledWith(loginReq.user);
  });

  it('should return null if authService.login returns null', async () => {
    const user = {
      user: { username: mockUser.email, password: mockUser.password },
    };
    jest.spyOn(mockAuthService, 'login').mockImplementationOnce(() => null);
    expect(await controller.login(user)).toEqual(null);
  });

  it('should create user with passed in role with OpsSignUp function', async () => {
    const userDto = {
      name: 'test',
      email: 'test@test.com',
      password: '123455',
      role: Role.ops,
    };
    expect(await controller.OpsSignUp(userDto)).toEqual({
      id: expect.any(Number),
      ...userDto,
    });
    expect(mockAuthService.create).toHaveBeenCalledWith(userDto);
  });

  it('should create user with signUp function with quant role', async () => {
    const userDto = {
      name: 'test',
      email: 'test@test.com',
      password: '123456',
    };
    expect(await controller.signUp(userDto)).toEqual({
      id: expect.any(Number),
      ...userDto,
      role: Role.quant,
    });
    expect(mockAuthService.create).toHaveBeenCalledWith({
      ...userDto,
      role: Role.quant,
    });
  });

  it('should create user with signUp function with quant role regardless of passed in role', async () => {
    const userDto = {
      name: 'test',
      email: 'test@test.com',
      password: '123456',
      role: Role.ops,
    };
    expect(await controller.signUp(userDto)).toEqual({
      id: expect.any(Number),
      ...userDto,
      role: Role.quant,
    });
    expect(mockAuthService.create).toHaveBeenCalledWith({
      ...userDto,
      role: Role.quant,
    });
  });
});
