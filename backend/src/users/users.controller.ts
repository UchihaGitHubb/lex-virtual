import { Controller, Get, Post, Body, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    return this.usersService.findById(req['user'].sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('role/select')
  async selectRole(@Req() req: any, @Body() dto: { role: string }) {
    return this.usersService.selectRole(req['user'].sub, dto.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post('role/confirm')
  async confirmRole(@Req() req: any) {
    return this.usersService.confirmRole(req['user'].sub);
  }
}
