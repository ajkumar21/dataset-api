import { IsEnum, IsNotEmpty } from 'class-validator';
import { Asset } from '../../model/asset.enum';

export class marketCapdto {
  @IsNotEmpty()
  readonly date: string;

  @IsNotEmpty()
  @IsEnum(Asset)
  readonly name: Asset;

  @IsNotEmpty()
  readonly marketCap: string;
}
