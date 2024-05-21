import { Injectable, Inject } from '@nestjs/common';
import { User } from './user.entity';
import { UserDto } from './dto/user.dto';
import { USER_REPOSITORY } from '../../core/constants';
import { DataSet, RequestDataSet } from '../model/asset.enum';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: typeof User,
  ) {}

  async create(user: UserDto): Promise<User> {
    return await this.userRepository.create<User>(user);
  }

  async addDataSet(email: string, dataSet: RequestDataSet): Promise<User> {
    const user = await this.findOneByEmail(email);
    const userDataSets = user.approvedDatasets;
    let newDataSet: DataSet[] = [];
    let symbolFound = false;
    if (userDataSets) {
      newDataSet = userDataSets.map((userDataSet) => {
        if (userDataSet.symbol === dataSet.symbol) {
          symbolFound = true;
          const existingFrequency = userDataSet.frequencyInfo.find(
            (userFrequencyDetail) =>
              userFrequencyDetail.frequency === dataSet.frequencyInfo.frequency,
          );

          if (existingFrequency) {
            if (
              existingFrequency.expiryDate &&
              existingFrequency.expiryDate < dataSet.frequencyInfo.expiryDate
            ) {
              return {
                symbol: dataSet.symbol,
                frequencyInfo: [
                  {
                    ...existingFrequency,
                    expiryDate: dataSet.frequencyInfo.expiryDate,
                  },
                ],
              };
            }
          } else {
            return {
              symbol: dataSet.symbol,
              frequencyInfo: [
                ...userDataSet.frequencyInfo,
                dataSet.frequencyInfo,
              ],
            };
          }
        }
        return userDataSet;
      });
    }

    if (!symbolFound) {
      newDataSet.push({
        symbol: dataSet.symbol,
        frequencyInfo: [dataSet.frequencyInfo],
      });
    }

    user.approvedDatasets = newDataSet;
    await user.save();
    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne<User>({ where: { email } });
  }

  async findOneById(id: number): Promise<User> {
    return await this.userRepository.findOne<User>({ where: { id } });
  }
}
