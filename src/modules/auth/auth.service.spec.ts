import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { Role } from '../model/role.enum';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let authService: AuthService;

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

  const mockToken = 'token';
  const mockJwtService = {
    signAsync: jest.fn(() => mockToken),
  };

  let bcryptCompare: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, UsersService, JwtService],
    })
      .overrideProvider(UsersService)
      .useValue(mockUserService)
      .overrideProvider(JwtService)
      .useValue(mockJwtService)
      .compile();

    authService = module.get<AuthService>(AuthService);
    bcryptCompare = jest.fn().mockReturnValue(true);
    (bcrypt.compare as jest.Mock) = bcryptCompare;
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should validate user', async () => {
    bcryptCompare.mockReturnValue(true);

    const validateUserResult = await authService.validateUser(
      mockUser.email,
      mockUser.password,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = mockUser.dataValues;
    expect(mockUserService.findOneByEmail).toHaveBeenCalledTimes(1);
    expect(validateUserResult).toEqual(result);
  });

  it('should generate a token for logged in user', async () => {
    const { user, token } = await authService.login({
      username: mockUser.dataValues.email,
      password: mockUser.dataValues.password,
    });
    expect(token).toBe(mockToken);
    expect(user).toEqual({
      username: mockUser.dataValues.email,
      password: mockUser.dataValues.password,
    });
  });
});
