import { Module } from '@nestjs/common';
import { DatabaseModule } from './core/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { RequestsModule } from './modules/accessRequest/request.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { MarketCapModule } from './modules/marketCapScheduler/marketCap.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    RequestsModule,
    PricingModule,
    MarketCapModule,
  ],
})
export class AppModule {}
