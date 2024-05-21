import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { USER_REPOSITORY } from '../src/core/constants';
import { Repository } from 'sequelize-typescript';
import { User } from '../src/modules/users/user.entity';
import { Role } from '../src/modules/model/role.enum';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    userRepository = moduleFixture.get(USER_REPOSITORY);
  });

  afterAll(async () => {
    await userRepository.destroy({
      truncate: true,
    });
  });

  const user = {
    name: 'test',
    email: 'test@test.com',
    password: '123456',
  };

  const opsUser = {
    name: 'opsUser',
    email: 'ops@test.com',
    password: '123456',
  };

  let opsUserToken = '';

  it('[POST] /auth/signup - should create quant user', async () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send(user)
      .expect(201);
  });

  it('[POST] /auth/signup - should return 400 if missing property in body', async () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'quant11@test.com', password: user.password })
      .expect(400);
  });

  it('[POST] /auth/signup - should return 400 as email already registered', async () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send(user)
      .expect(403)
      .then((res) => {
        expect(res.body.message).toEqual('This email already exist');
      });
  });

  it('[POST] /auth/signup - should return 403 if password is less than 6 characters', async () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({ name: 'test', email: 'test1@test.com', password: '12345' })
      .expect(400)
      .then((res) => {
        expect(res.body.message).toEqual([
          'Password is less than 6 characters',
        ]);
      });
  });
  it('[POST] /auth/signup - should return 400 if missing a property in request body', async () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'test1@test.com', password: '123456' })
      .expect(400)
      .then((res) => {
        expect(res.body.message).toEqual(['name should not be empty']);
      });
  });

  it('[POST] /auth/signup - should return 400 if email is not formatted properly', async () => {
    return request(app.getHttpServer())
      .post('/auth/signup')
      .send({ name: 'test', email: 'test1test.com', password: '123456' })
      .expect(400)
      .then((res) => {
        expect(res.body.message).toEqual(['email must be an email']);
      });
  });

  it('[POST] /auth/signup - should ignore role field', async () => {
    const opsUser3 = {
      name: 'opsUser3',
      email: 'ops3@test.com',
      password: '123456',
      role: Role.ops,
    };

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send(opsUser3)
      .expect(201);

    const userFromDb = await userRepository.findOne({
      where: { email: opsUser3.email },
    });
    //Indicates that this endpoint cant be used to create ops users
    expect(userFromDb.role).toBe(Role.quant);
  });

  it('[POST] /auth/ops/signup - should create ops user', async () => {
    //Need an ops user in DB initally
    await request(app.getHttpServer()).post('/auth/signup').send(opsUser);
    const opsUserDBEntry = await userRepository.findOne({
      where: { email: opsUser.email },
    });
    opsUserDBEntry.role = Role.ops;
    await opsUserDBEntry.save();

    //Obtain ops token
    const { body } = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: opsUser.email, password: opsUser.password })
      .expect(200);
    expect(body.token).toBeDefined();
    opsUserToken = body.token;

    const opsUser2 = {
      name: 'opsUser2',
      email: 'ops2@test.com',
      password: '123456',
      role: Role.ops,
    };

    return request(app.getHttpServer())
      .post('/auth/ops/signup')
      .set('Authorization', `Bearer ${opsUserToken}`)
      .send(opsUser2)
      .expect(201);
  });

  it('[POST] /auth/ops/signup - should create quant user', async () => {
    const quantUser2 = {
      name: 'quant user 2',
      email: 'quant2@test.com',
      password: '123456',
      role: Role.quant,
    };
    return request(app.getHttpServer())
      .post('/auth/ops/signup')
      .set('Authorization', `Bearer ${opsUserToken}`)
      .send(quantUser2)
      .expect(201);
  });

  it('[POST] /auth/ops/signup - should return 401 if invalid bearer token', async () => {
    const quantUser2 = {
      name: 'quant user 2',
      email: 'quant2@test.com',
      password: '123456',
      role: Role.quant,
    };
    return request(app.getHttpServer())
      .post('/auth/ops/signup')
      .set('Authorization', `Bearer 1`)
      .send(quantUser2)
      .expect(401);
  });

  it('[POST] /auth/ops/signup - should return 400 if missing propery in request body', async () => {
    const quantUser2 = {
      name: 'quant user 2',
      email: 'quant22@test.com',
      password: '123456',
    };
    return request(app.getHttpServer())
      .post('/auth/ops/signup')
      .set('Authorization', `Bearer ${opsUserToken}`)
      .send(quantUser2)
      .expect(400)
      .then((res) =>
        expect(res.body.message).toEqual([
          'Role must be either quant or ops',
          'role should not be empty',
        ]),
      );
  });

  it('[POST] /auth/login - should login ops user', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: opsUser.email, password: opsUser.password })
      .expect(200);
  });

  it('[POST] /auth/login - should login quant user', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: user.email, password: user.password })
      .expect(200)
      .then((res) => {
        expect(res.body.token).toBeDefined();
      });
  });

  it('[POST] /auth/login - should return 401 if invalid credentials passed', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: user.email, password: '12' })
      .expect(401);
  });
});
