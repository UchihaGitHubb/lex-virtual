import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { WhoAmI } from '../auth/dtos/who-am-i.dto';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // Obtener mi perfil
  @Get('my-profile')
  async getMyProfile(@Req() req: { user: WhoAmI }) {
    return this.studentsService.getMyProfile(req.user.sub);
  }

  // Obtener mis casos con progreso
  @Get('my-cases')
  async getMyCases(@Req() req: { user: WhoAmI }) {
    return this.studentsService.getMyCases(req.user.sub);
  }

  // Obtener mis estadísticas generales
  @Get('my-stats')
  async getMyStats(@Req() req: { user: WhoAmI }) {
    return this.studentsService.getMyStats(req.user.sub);
  }
}

