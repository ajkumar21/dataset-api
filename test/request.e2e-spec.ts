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

describe('RequestController (e2e)', () => {
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

  it('[GET] /request/datasets - quant should be able to view datasets', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send(user)
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: user.email, password: user.password })
      .expect(200);

    expect(loginResponse.body.token).toBeDefined();
    quantUserToken = loginResponse.body.token;
    const datasetResponse = await request(app.getHttpServer())
      .get('/request/datasets')
      .set('Authorization', `Bearer ${quantUserToken}`)
      .expect(200);
    expect(datasetResponse.body).toEqual({
      bitcoin: {
        name: 'Bitcoin',
        frequencies: [Frequency.hourly, Frequency.daily, Frequency.monthly],
      },

      ethereum: { name: 'Ethereum', frequencies: [Frequency.daily] },
    });
  });

  it('[POST] /request/access - should allow quant to request access to an asset', () => {
    return request(app.getHttpServer())
      .post('/request/access')
      .set('Authorization', `Bearer ${quantUserToken}`)
      .send({ symbol: Asset.BTC, frequency: Frequency.hourly })
      .expect(201);
  });

  it('[GET] /request/access - should prevent quant from requesting and invalid asset combination', () => {
    return request(app.getHttpServer())
      .post('/request/access')
      .set('Authorization', `Bearer ${quantUserToken}`)
      .send({ symbol: Asset.ETH, frequency: Frequency.monthly })
      .expect(400)
      .then((res) => {
        expect(res.body.message).toEqual('Invalid asset-frequency combination');
      });
  });

  it('[GET] /request/all - ops should be view all requests', async () => {
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

    const datasetResponse = await request(app.getHttpServer())
      .get('/request/all')
      .set('Authorization', `Bearer ${opsUserToken}`)
      .expect(200);
    expect(datasetResponse.body).toEqual([
      {
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        id: expect.any(Number),
        email: user.email,
        symbol: Asset.BTC,
        frequency: Frequency.hourly,
      },
    ]);
  });

  it('[GET] /request/all - return 401 if invalid bearer token passed', () => {
    return request(app.getHttpServer())
      .get('/request/all')
      .set('Authorization', `Bearer 1`)
      .expect(401);
  });

  it('[POST] /request/approve - allow ops to approve a specific request with id', async () => {
    const { id } = await requestRepository.findOne({
      where: { email: user.email },
    });
    return request(app.getHttpServer())
      .post(`/request/approve`)
      .query({
        id,
      })
      .set('Authorization', `Bearer ${opsUserToken}`)
      .expect(200)
      .then((res) => expect(res.body.message).toEqual('Approval successful'));
  });

  it('[POST] /request/approve - allow ops to approve a specific request with id for a trial period', async () => {
    await request(app.getHttpServer())
      .post('/request/access')
      .set('Authorization', `Bearer ${quantUserToken}`)
      .send({ symbol: Asset.BTC, frequency: Frequency.daily })
      .expect(201);
    const { id } = await requestRepository.findOne({
      where: { email: user.email },
    });
    const expiryDate = '2023-05-01T00:00:00.000Z';
    return request(app.getHttpServer())
      .post(`/request/approve`)
      .query({
        id,
        expiryDate,
      })
      .set('Authorization', `Bearer ${opsUserToken}`)
      .expect(200)
      .then((res) => expect(res.body.message).toEqual('Approval successful'));
  });

  it('[POST] /request/approve - return bad request if invalid id present', async () => {
    return request(app.getHttpServer())
      .post(`/request/approve`)
      .query({
        id: '1',
      })
      .set('Authorization', `Bearer ${opsUserToken}`)
      .expect(400);
  });

  it('[POST] /request/approve - return forbidden 403 if non ops user token passed', async () => {
    return request(app.getHttpServer())
      .post(`/request/approve`)
      .query({
        id: '1',
      })
      .set('Authorization', `Bearer ${quantUserToken}`)
      .expect(403);
  });

  it('[POST] /request/approve - return unauthorized 401 if invalid user token passed', async () => {
    return request(app.getHttpServer())
      .post(`/request/approve`)
      .query({
        id: '1',
      })
      .set('Authorization', `Bearer 1`)
      .expect(401);
  });

  it('[POST] /request/refuse - allow ops to refuse a specific request with id', async () => {
    await request(app.getHttpServer())
      .post('/request/access')
      .set('Authorization', `Bearer ${quantUserToken}`)
      .send({ symbol: Asset.BTC, frequency: Frequency.monthly })
      .expect(201);
    const { id } = await requestRepository.findOne({
      where: { email: user.email },
    });
    return request(app.getHttpServer())
      .post(`/request/refuse`)
      .query({
        id,
      })
      .set('Authorization', `Bearer ${opsUserToken}`)
      .expect(200)
      .then((res) => expect(res.body.message).toEqual('Refusal successful'));
  });

  it('[POST] /request/refuse - return bad request if invalid id present', async () => {
    return request(app.getHttpServer())
      .post(`/request/refuse`)
      .query({
        id: '1',
      })
      .set('Authorization', `Bearer ${opsUserToken}`)
      .expect(400);
  });

  it('[POST] /request/refuse - return forbidden 403 if non ops user token passed', async () => {
    return request(app.getHttpServer())
      .post(`/request/refuse`)
      .query({
        id: '1',
      })
      .set('Authorization', `Bearer ${quantUserToken}`)
      .expect(403);
  });

  it('[POST] /request/refuse - return unauthorized 401 if invalid user token passed', async () => {
    return request(app.getHttpServer())
      .post(`/request/refuse`)
      .query({
        id: '1',
      })
      .set('Authorization', `Bearer 1`)
      .expect(401);
  });
});
