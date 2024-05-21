import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { REQUEST_REPOSITORY, USER_REPOSITORY } from '../src/core/constants';
import { Repository } from 'sequelize-typescript';
import { User } from '../src/modules/users/user.entity';
import { Role } from '../src/modules/model/role.enum';
import { Request } from '../src/modules/accessRequest/request.entity';
import { Asset, Frequency } from '../src/modules/model/asset.enum';

describe('PricingController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let requestRepository: Repository<Request>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    userRepository = moduleFixture.get(USER_REPOSITORY);
    requestRepository = moduleFixture.get(REQUEST_REPOSITORY);
  });

  afterAll(async () => {
    await userRepository.destroy({
      truncate: true,
    });
    await requestRepository.destroy({
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
  let quantUserToken = '';

  it('[POST] /pricing/data/asset/frequency - quant should be able to view pricing data on datasets they have access to - hourly', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send(user)
      .expect(201);

    let loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: user.email, password: user.password })
      .expect(200);

    expect(loginResponse.body.token).toBeDefined();
    quantUserToken = loginResponse.body.token;
    await request(app.getHttpServer())
      .post('/request/access')
      .set('Authorization', `Bearer ${quantUserToken}`)
      .send({ symbol: Asset.BTC, frequency: Frequency.hourly })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/signup')
      .send(opsUser)
      .expect(201);

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
    const { id } = await requestRepository.findOne({
      where: { email: user.email },
    });
    await request(app.getHttpServer())
      .post(`/request/approve`)
      .query({
        id,
      })
      .set('Authorization', `Bearer ${opsUserToken}`)
      .expect(200)
      .then((res) => expect(res.body.message).toEqual('Approval successful'));

    //Quant needs to login again to get token with updated permissions
    loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: user.email, password: user.password })
      .expect(200);

    expect(loginResponse.body.token).toBeDefined();
    quantUserToken = loginResponse.body.token;
    return request(app.getHttpServer())
      .get(`/pricing/data/${Asset.BTC}/${Frequency.hourly}`)
      .set('Authorization', `Bearer ${quantUserToken}`)
      .expect(200)
      .then((res) =>
        expect(res.body.data[0]).toEqual({
          priceUsd: expect.any(String),
          time: expect.any(Number),
          date: expect.any(String),
          circulatingSupply: expect.any(String),
        }),
      );
  });

  it('[POST] /pricing/data/asset/frequency - quant should be able to view pricing data on datasets they have access to - monthly', async () => {
    await request(app.getHttpServer())
      .post('/request/access')
      .set('Authorization', `Bearer ${quantUserToken}`)
      .send({ symbol: Asset.BTC, frequency: Frequency.monthly })
      .expect(201);

    const { id } = await requestRepository.findOne({
      where: { email: user.email },
    });
    await request(app.getHttpServer())
      .post(`/request/approve`)
      .query({
        id,
      })
      .set('Authorization', `Bearer ${opsUserToken}`)
      .expect(200)
      .then((res) => expect(res.body.message).toEqual('Approval successful'));

    //Quant needs to login again to get token with updated permissions
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: user.email, password: user.password })
      .expect(200);

    expect(loginResponse.body.token).toBeDefined();
    quantUserToken = loginResponse.body.token;
    return request(app.getHttpServer())
      .get(`/pricing/data/${Asset.BTC}/${Frequency.monthly}`)
      .set('Authorization', `Bearer ${quantUserToken}`)
      .expect(200)
      .then((res) =>
        expect(res.body.data[0]).toEqual({
          priceUsd: expect.any(String),
          time: expect.any(Number),
          date: expect.any(String),
        }),
      );
  });

  it('[POST] /pricing/data/asset/frequency - quant should not be able to view pricing data on datasets they do not have access to', () => {
    return request(app.getHttpServer())
      .get(`/pricing/data/${Asset.BTC}/${Frequency.daily}`)
      .set('Authorization', `Bearer ${quantUserToken}`)
      .expect(403)
      .then((res) =>
        expect(res.body.message).toEqual(
          'You do not have access to this asset-frequency combination. Please request access',
        ),
      );
  });

  it('[POST] /pricing/data/asset/frequency - quant should not be able to view pricing data of invalid asset combinations', () => {
    return request(app.getHttpServer())
      .get(`/pricing/data/${Asset.ETH}/${Frequency.monthly}`)
      .set('Authorization', `Bearer ${quantUserToken}`)
      .expect(400)
      .then((res) =>
        expect(res.body.message).toEqual('Invalid asset frequency combination'),
      );
  });

  it('[POST] /pricing/data/asset/frequency - quant should not be able to view pricing data of invalid asset combinations', () => {
    return request(app.getHttpServer())
      .get(`/pricing/data/solana/${Frequency.monthly}`)
      .set('Authorization', `Bearer ${quantUserToken}`)
      .expect(400)
      .then((res) => expect(res.body.message).toEqual('Invalid asset class'));
  });

  it('[POST] /pricing/data/asset/frequency - quant should not be able to view pricing data for expired approvals', async () => {
    await request(app.getHttpServer())
      .post('/request/access')
      .set('Authorization', `Bearer ${quantUserToken}`)
      .send({ symbol: Asset.ETH, frequency: Frequency.daily })
      .expect(201);

    const { id } = await requestRepository.findOne({
      where: { email: user.email },
    });

    await request(app.getHttpServer())
      .post(`/request/approve`)
      .query({
        id,
        expiryDate: '2022-05-01T00:00:00.000Z',
      })
      .set('Authorization', `Bearer ${opsUserToken}`)
      .expect(200)
      .then((res) => expect(res.body.message).toEqual('Approval successful'));

    //Quant needs to login again to get token with updated permissions
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: user.email, password: user.password })
      .expect(200);

    expect(loginResponse.body.token).toBeDefined();
    quantUserToken = loginResponse.body.token;

    return request(app.getHttpServer())
      .get(`/pricing/data/${Asset.ETH}/${Frequency.daily}`)
      .set('Authorization', `Bearer ${quantUserToken}`)
      .expect(403)
      .then((res) =>
        expect(res.body.message).toEqual(
          'Access to asset frequency combination has expired. Please request for access',
        ),
      );
  });
  it('[POST] /pricing/data/asset/frequency - return 401 if invalid bearer token', () => {
    return request(app.getHttpServer())
      .get(`/pricing/data/solana/${Frequency.monthly}`)
      .set('Authorization', `Bearer 1`)
      .expect(401);
  });
});
