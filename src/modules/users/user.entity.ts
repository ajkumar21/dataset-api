import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { Role } from '../model/role.enum';
import { DataSet } from '../model/asset.enum';

@Table
export class User extends Model<User> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;

  @Column({
    type: DataType.ENUM,
    values: Object.values(Role),
    allowNull: false,
  })
  role: Role;

  @Column({
    type: DataType.ARRAY(DataType.JSON),
    allowNull: true,
    defaultValue: null,
  })
  approvedDatasets: DataSet[];
}
