import { IsEnum, IsNotEmpty } from 'class-validator';
import { Asset, Frequency } from '../../model/asset.enum';

export class RequestDto {
  @IsNotEmpty()
  @IsEnum(Asset, { message: 'Invalid Symbol' })
  readonly symbol: Asset;

  @IsNotEmpty()
  @IsEnum(Frequency, { message: 'Invalid frequency' })
  readonly frequency: Frequency;
}
