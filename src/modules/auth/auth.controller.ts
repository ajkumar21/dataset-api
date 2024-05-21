import {
  Controller,
  Body,
  Post,
  UseGuards,
  Request,
  HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserDto, UserDtoWithoutRole } from '../users/dto/user.dto';
import { HasRoles } from './has-roles.decorator';
import { Role } from '../model/role.enum';
import { RolesGuard } from '../../core/guards/roles.guard';
import { DoesUserExist } from '../../core/guards/doesUserExist.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @HttpCode(200)
  @Post('login')
  async login(@Request() req) {
    return await this.authService.login(req.user);
  }

  //Admin signup api for Ops users only. They can sign up other ops employees
  @HasRoles(Role.ops)
  @UseGuards(AuthGuard('jwt'), RolesGuard, DoesUserExist)
  @Post('ops/signup')
  async OpsSignUp(@Body() user: UserDto) {
    return await this.authService.create(user);
  }

  //Default signup api for quant traders. Can only sign up with quant role
  @UseGuards(DoesUserExist)
  @Post('signup')
  async signUp(@Body() user: UserDtoWithoutRole) {
    return await this.authService.create({ ...user, role: Role.quant });
  }
}
