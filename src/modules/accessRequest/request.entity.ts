import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Asset, Frequency } from '../model/asset.enum';

@Table
export class Request extends Model<Request> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  email: string;

  @Column({
    type: DataType.ENUM,
    values: Object.values(Asset),
    allowNull: false,
  })
  symbol: Asset;

  @Column({
    type: DataType.ENUM,
    values: Object.values(Frequency),
    allowNull: false,
  })
  frequency: Frequency;
}
