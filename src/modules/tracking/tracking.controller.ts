import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { WhoAmI } from '../auth/dtos/who-am-i.dto';
import {
  CreateTextFeedbackDto,
  CreateVoiceFeedbackDto,
  CreateCaseDto,
  CreatePerformanceMetricsDto,
  UpdateCaseStatusDto,
} from './dtos';

@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  // HU_6.1.1: Lista de estudiantes con casos realizados
  @Get('students')
  async getStudentsList(@Req() req: { user: WhoAmI }) {
    return this.trackingService.getStudentsList(req.user.sub);
  }

  // HU_6.1.2: Detalles de un estudiante
  @Get('students/:studentId')
  async getStudentDetails(
    @Param('studentId') studentId: string,
    @Req() req: { user: WhoAmI },
  ) {
    return this.trackingService.getStudentDetails(studentId, req.user.sub);
  }

  // HU_6.1.2 y HU_6.2.1: Métricas de desempeño de un caso específico
  @Get('cases/:caseId/performance')
  async getCasePerformance(
    @Param('caseId') caseId: string,
    @Req() req: { user: WhoAmI },
  ) {
    return this.trackingService.getCasePerformance(caseId, req.user.sub);
  }

  // HU_6.2.2: Gráfico de nerviosismo por etapas
  @Get('cases/:caseId/nerviosism-chart')
  async getNerviosismChart(
    @Param('caseId') caseId: string,
    @Req() req: { user: WhoAmI },
  ) {
    return this.trackingService.getNerviosismChart(caseId, req.user.sub);
  }

  // HU_6.3.1: Crear comentario de texto
  @Post('feedback/text')
  async createTextFeedback(
    @Body() dto: CreateTextFeedbackDto,
    @Req() req: { user: WhoAmI },
  ) {
    return this.trackingService.createTextFeedback(dto, req.user.sub);
  }

  // HU_6.3.2: Crear comentario de voz
  @Post('feedback/voice')
  async createVoiceFeedback(
    @Body() dto: CreateVoiceFeedbackDto,
    @Req() req: { user: WhoAmI },
  ) {
    return this.trackingService.createVoiceFeedback(dto, req.user.sub);
  }

  // HU_6.5.1: Obtener feedback de un estudiante (incluye niveles de nerviosismo)
  @Get('students/:studentId/feedback')
  async getStudentFeedback(
    @Param('studentId') studentId: string,
    @Req() req: { user: WhoAmI },
  ) {
    return this.trackingService.getStudentFeedback(studentId, req.user.sub);
  }

  // Obtener feedback de un caso específico
  @Get('cases/:caseId/feedback')
  async getCaseFeedback(
    @Param('caseId') caseId: string,
    @Req() req: { user: WhoAmI },
  ) {
    return this.trackingService.getCaseFeedback(caseId, req.user.sub);
  }

  // Endpoint para estudiantes: Obtener mis retroalimentaciones (filtradas por grupo)
  @Get('my-feedbacks')
  async getMyFeedbacks(@Req() req: { user: WhoAmI }) {
    return this.trackingService.getMyFeedbacks(req.user.sub);
  }

  // ========== ENDPOINTS PARA UNITY (VR APP) ==========

  // Crear un nuevo caso (Unity)
  @Post('cases')
  async createCase(
    @Body() dto: CreateCaseDto,
    @Req() req: { user: WhoAmI },
  ) {
    return this.trackingService.createCase(dto, req.user.sub);
  }

  // Actualizar estado de un caso (Unity)
  @Put('cases/:caseId/status')
  async updateCaseStatus(
    @Param('caseId') caseId: string,
    @Body() dto: UpdateCaseStatusDto,
    @Req() req: { user: WhoAmI },
  ) {
    return this.trackingService.updateCaseStatus(caseId, dto, req.user.sub);
  }

  // Crear métricas de desempeño (Unity)
  @Post('cases/:caseId/metrics')
  async createPerformanceMetrics(
    @Param('caseId') caseId: string,
    @Body() dto: CreatePerformanceMetricsDto,
    @Req() req: { user: WhoAmI },
  ) {
    // Asegurar que el caseId del DTO coincida con el parámetro
    dto.caseId = caseId;
    return this.trackingService.createPerformanceMetrics(dto, req.user.sub);
  }

  // Actualizar métricas de desempeño (Unity)
  @Put('cases/:caseId/metrics')
  async updatePerformanceMetrics(
    @Param('caseId') caseId: string,
    @Body() dto: CreatePerformanceMetricsDto,
    @Req() req: { user: WhoAmI },
  ) {
    // Asegurar que el caseId del DTO coincida con el parámetro
    dto.caseId = caseId;
    return this.trackingService.updatePerformanceMetrics(caseId, dto, req.user.sub);
  }
}

