import { MARKETCAP_REPOSITORY } from '../../core/constants';
import { MarketCap } from './marketCap.entity';

export const usersProviders = [
  {
    provide: MARKETCAP_REPOSITORY,
    useValue: MarketCap,
  },
];
