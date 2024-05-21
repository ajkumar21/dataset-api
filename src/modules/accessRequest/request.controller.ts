import {
  Controller,
  Body,
  Post,
  UseGuards,
  Request,
  Get,
  BadRequestException,
  Query,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../model/role.enum';
import { RolesGuard } from '../../core/guards/roles.guard';
import { RequestsService } from './request.service';
import { RequestDto } from './dto/request.dto';
import { HasRoles } from '../auth/has-roles.decorator';
import { assetCombinationMap } from '../model/asset.enum';
import { DoesRequestExist } from '../../core/guards/doesRequestExist.guard';

@Controller('request')
export class RequestsController {
  constructor(private requestService: RequestsService) {}

  @HasRoles(Role.quant)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('datasets')
  getMetadata() {
    return this.requestService.getDatasetMetadata();
  }

  @HasRoles(Role.quant)
  @UseGuards(AuthGuard('jwt'), RolesGuard, DoesRequestExist)
  @Post('access')
  requestAccessToDataset(@Body() request: RequestDto, @Request() req: any) {
    if (
      !assetCombinationMap
        .get(request.symbol)
        .frequencies.includes(request.frequency)
    ) {
      throw new BadRequestException('Invalid asset-frequency combination');
    }

    return this.requestService.create(request, req.user.payload.email);
  }

  @HasRoles(Role.ops)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get('all')
  getRequests() {
    return this.requestService.getAllRequests();
  }

  @HasRoles(Role.ops)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(200)
  @Post('approve')
  approveRequest(
    @Query('id') id: string,
    @Query('expiryDate') expiryDate?: string,
  ) {
    return this.requestService.approveRequest(id, expiryDate);
  }

  @HasRoles(Role.ops)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HttpCode(200)
  @Post('refuse')
  refuseRequest(@Query('id') id: string) {
    return this.requestService.refuseRequest(id);
  }
}
