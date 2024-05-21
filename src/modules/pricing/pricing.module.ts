import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../modules/auth/jwt.strategy';
import { PricingService } from './pricing.service';
import { UsersModule } from '../../modules/users/users.module';
import { RequestsModule } from '../../modules/accessRequest/request.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    PassportModule,
    RequestsModule,
    UsersModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    JwtModule.register({
      secret: process.env.JWTKEY,
      signOptions: { expiresIn: process.env.TOKEN_EXPIRATION },
    }),
  ],
  providers: [PricingService, JwtStrategy],
  controllers: [PricingController],
})
export class PricingModule {}
