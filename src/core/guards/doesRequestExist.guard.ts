import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { RequestsService } from '../../modules/accessRequest/request.service';

@Injectable()
export class DoesRequestExist implements CanActivate {
  constructor(private readonly requestsService: RequestsService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  async validateRequest(request) {
    const userExist = await this.requestsService.findOneByRequest(
      request.user.payload.email,
      {
        symbol: request.body.symbol,
        frequency: request.body.frequency,
      },
    );
    if (userExist) {
      throw new BadRequestException('This request already exist');
    }
    return true;
  }
}
