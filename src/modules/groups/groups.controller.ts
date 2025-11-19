import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { WhoAmI } from '../auth/dtos/who-am-i.dto';
import {
  CreateGroupDto,
  JoinGroupDto,
  ValidateGroupCodeDto,
} from './dtos';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // HU_6.4.1: Crear grupo (profesor)
  @Post()
  @UseGuards(JwtAuthGuard)
  async createGroup(
    @Body() dto: CreateGroupDto,
    @Req() req: { user: WhoAmI },
  ) {
    return this.groupsService.createGroup(dto, req.user.sub);
  }

  // HU_6.4.2: Validar código de grupo (público para permitir validación antes del registro)
  @Get('validate/:code')
  async validateGroupCode(@Param('code') code: string) {
    return this.groupsService.validateGroupCode(code);
  }

  // HU_6.4.2: Unirse a grupo (estudiante)
  @Post('join')
  @UseGuards(JwtAuthGuard)
  async joinGroup(
    @Body() dto: JoinGroupDto,
    @Req() req: { user: WhoAmI },
  ) {
    return this.groupsService.joinGroup(dto, req.user.sub);
  }

  // Obtener mi grupo
  @Get('my-group')
  @UseGuards(JwtAuthGuard)
  async getMyGroup(@Req() req: { user: WhoAmI }) {
    return this.groupsService.getMyGroup(req.user.sub);
  }
}

