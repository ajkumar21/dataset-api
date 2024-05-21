import {
  CanActivate,
  ExecutionContext,
  Injectable,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { RequestDto } from '../../modules/accessRequest/dto/request.dto';
import { RequestsService } from '../../modules/accessRequest/request.service';

@Injectable()
export class DoesRequestExist implements CanActivate {
  constructor(private readonly requestsService: RequestsService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const body = plainToClass(RequestDto, request.body);
    const errors = await validate(body);
    const errorMessages = errors.flatMap(({ constraints }) =>
      Object.values(constraints),
    );

    if (errorMessages.length > 0) {
      // return bad request if validation fails
      response.status(HttpStatus.BAD_REQUEST).send({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: errorMessages,
      });
    }
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
