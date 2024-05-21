import { Module } from '@nestjs/common';
import { RequestsService } from './request.service';
import { RequestsController } from './request.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from '../auth/jwt.strategy';
import { requestsProviders } from './request.providers';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    JwtModule.register({
      secret: process.env.JWTKEY,
      signOptions: { expiresIn: process.env.TOKEN_EXPIRATION },
    }),
  ],
  providers: [RequestsService, JwtStrategy, ...requestsProviders],
  controllers: [RequestsController],
  exports: [RequestsService],
})
export class RequestsModule {}
