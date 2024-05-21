import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { REQUEST_REPOSITORY } from '../../core/constants';
import { RequestDto } from './dto/request.dto';
import { Request } from './request.entity';
import { UsersService } from '../users/users.service';
import { Asset, assetCombinationMap } from '../model/asset.enum';

@Injectable()
export class RequestsService {
  constructor(
    @Inject(REQUEST_REPOSITORY)
    private readonly requestRepository: typeof Request,
    private readonly userService: UsersService,
  ) {}

  getDatasetMetadata() {
    return Object.fromEntries(assetCombinationMap);
  }

  getSpecificDatasetMetadata(asset: Asset) {
    return assetCombinationMap.get(asset);
  }

  async create(request: RequestDto, email: string): Promise<Request> {
    return await this.requestRepository.create<Request>({
      email,
      ...request,
    });
  }

  async getAllRequests(): Promise<Request[]> {
    return this.requestRepository.findAll();
  }

  async approveRequest(
    id,
    expiryDate?,
  ): Promise<{
    message: string;
    request: Request;
    expiryDate?: string;
  }> {
    const requestToApprove = await this.requestRepository.findOne<Request>({
      where: { id },
    });

    if (!requestToApprove) {
      throw new BadRequestException('Invalid Request ID');
    }

    const requestDetails = requestToApprove['dataValues'];
    if (expiryDate) {
      this.userService.addDataSet(requestDetails.email, {
        symbol: requestDetails.symbol,
        frequencyInfo: {
          frequency: requestDetails.frequency,
          expiryDate: new Date(expiryDate),
        },
      });
    } else {
      this.userService.addDataSet(requestDetails.email, {
        symbol: requestDetails.symbol,
        frequencyInfo: { frequency: requestDetails.frequency },
      });
    }

    await requestToApprove.destroy();

    const response = {
      message: 'Approval successful',
      request: requestToApprove,
      expiryDate,
    };
    return response;
  }

  async refuseRequest(id): Promise<{ message: string; request: Request }> {
    const requestToRefuse = await this.requestRepository.findOne<Request>({
      where: { id },
    });

    if (!requestToRefuse) {
      throw new BadRequestException('Invalid Request ID');
    }

    await requestToRefuse.destroy();
    const response = {
      message: 'Refusal successful',
      request: requestToRefuse,
    };
    return response;
  }

  async findOneByEmail(email: string): Promise<Request> {
    return await this.requestRepository.findOne<Request>({ where: { email } });
  }

  async findOneById(id: number): Promise<Request> {
    return await this.requestRepository.findOne<Request>({ where: { id } });
  }

  async findOneByRequest(email: string, request: RequestDto): Promise<Request> {
    return await this.requestRepository.findOne<Request>({
      where: {
        email: email,
        symbol: request.symbol,
        frequency: request.frequency,
      },
    });
  }
}
