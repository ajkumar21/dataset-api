import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table
export class MarketCap extends Model<MarketCap> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  date: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  marketCap: string;
}
