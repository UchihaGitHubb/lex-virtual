import { Controller, Post, Body, Req, UseGuards, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { User, UserRole } from './entities/user.entity';
import { WhoAmI } from '../auth/strategies/who-am-i.interface';
import { IsEnum } from 'class-validator';

// DTO para seleccionar rol
class SelectRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('role/select')
  async selectRole(
    @Req() req: { user: WhoAmI },
    @Body() dto: SelectRoleDto,
  ): Promise<{ message: string; user: User }> {
    const user = await this.usersService.selectRole(req.user.sub, dto.role);
    return {
      message: 'Rol seleccionado exitosamente',
      user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('role/confirm')
  async confirmRole(
    @Req() req: { user: WhoAmI },
  ): Promise<{ message: string; user: User }> {
    const user = await this.usersService.confirmRole(req.user.sub);
    return {
      message: 'Rol confirmado exitosamente',
      user,
    };
  }
}
