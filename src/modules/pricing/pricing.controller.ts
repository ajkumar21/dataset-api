import { Controller, Get, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../core/guards/roles.guard';
import { HasRoles } from '../../modules/auth/has-roles.decorator';
import { Role } from '../../modules/model/role.enum';
import { PricingService } from './pricing.service';
import { Asset, Frequency } from '../../modules/model/asset.enum';

@Controller('pricing')
export class PricingController {
  constructor(private pricingService: PricingService) {}

  @HasRoles(Role.quant)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('data/:asset/:frequency')
  getData(
    @Param('asset') asset: Asset,
    @Param('frequency') frequency: Frequency,
    @Request() req: any,
  ) {
    return this.pricingService.getData(
      asset,
      frequency,
      req.user.payload.approvedDatasets,
    );
  }
}
