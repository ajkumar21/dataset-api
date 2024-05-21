import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { Role } from '../../model/role.enum';

export class UserDtoWithoutRole {
  @IsNotEmpty()
  readonly name: string;

  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'Password is less than 6 characters' })
  readonly password: string;
}

export class UserDto extends UserDtoWithoutRole {
  @IsNotEmpty()
  @IsEnum(Role, { message: 'Role must be either quant or ops' })
  readonly role: Role;
}
