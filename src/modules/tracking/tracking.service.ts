import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Case, CaseStatus } from './entities/case.entity';
import { PerformanceMetrics } from './entities/performance-metrics.entity';
import { NerviosismStageData } from './entities/nerviosism-stage-data.entity';
import { Feedback, FeedbackType } from './entities/feedback.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';
import {
  StudentListItemDto,
  StudentDetailsDto,
  CasePerformanceDto,
  NerviosismChartDto,
  CreateTextFeedbackDto,
  CreateVoiceFeedbackDto,
  FeedbackResponseDto,
  StudentFeedbackItemDto,
  CreateCaseDto,
  CreatePerformanceMetricsDto,
  UpdateCaseStatusDto,
  StageNames,
} from './dtos';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(Case)
    private readonly caseRepository: Repository<Case>,
    @InjectRepository(PerformanceMetrics)
    private readonly performanceMetricsRepository: Repository<PerformanceMetrics>,
    @InjectRepository(NerviosismStageData)
    private readonly nerviosismStageDataRepository: Repository<NerviosismStageData>,
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  public async getStudentsList(teacherId: string): Promise<StudentListItemDto[]> {
    await this.ensureTeacherRole(teacherId);

    const students = await this.userRepository.find({
      where: { role: UserRole.Student },
    });

    const studentsList = await Promise.all(
      students.map(async (student) => {
        const completedCases = await this.caseRepository.find({
          where: {
            studentId: student.id,
            status: CaseStatus.Completed,
          },
          relations: ['performanceMetrics'],
          order: { caseNumber: 'DESC' },
        });

        const lastCase = completedCases.at(0) ?? null;
        const lastCaseTimeSeconds =
          lastCase?.performanceMetrics?.totalTimeSeconds ?? null;

        return {
          studentId: student.id,
          studentName: student.firstName ?? 'Sin nombre',
          studentLastName: student.lastName ?? 'Sin apellido',
          casesCompleted: completedCases.length,
          lastCaseNumber: lastCase ? lastCase.caseNumber : null,
          lastCaseTimeSeconds,
        };
      }),
    );

    return studentsList;
  }

  public async getStudentDetails(
    studentId: string,
    teacherId: string,
  ): Promise<StudentDetailsDto> {
    await this.ensureTeacherRole(teacherId);

    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.Student },
    });

    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const cases = await this.caseRepository.find({
      where: { studentId, status: CaseStatus.Completed },
      relations: ['performanceMetrics'],
      order: { caseNumber: 'DESC' },
    });

    const performanceMetrics = cases
      .filter((caseEntity) => Boolean(caseEntity.performanceMetrics))
      .map((caseEntity) => ({
        caseId: caseEntity.id,
        caseNumber: caseEntity.caseNumber,
        fillerWords: caseEntity.performanceMetrics!.fillerWords,
        interruptionsCount: caseEntity.performanceMetrics!.interruptionsCount,
        totalTimeSeconds: caseEntity.performanceMetrics!.totalTimeSeconds,
        heartRateBpm: caseEntity.performanceMetrics!.heartRateBpm,
        nerviosismLevel: caseEntity.performanceMetrics!.nerviosismLevel,
      }));

    return {
      studentId: student.id,
      studentName: student.firstName ?? 'Sin nombre',
      studentLastName: student.lastName ?? 'Sin apellido',
      casesCompleted: cases.length,
      performanceMetrics,
    };
  }

  public async getCasePerformance(
    caseId: string,
    teacherId: string,
  ): Promise<CasePerformanceDto> {
    await this.ensureTeacherRole(teacherId);

    const caseEntity = await this.caseRepository.findOne({
      where: { id: caseId },
      relations: ['performanceMetrics', 'performanceMetrics.nerviosismStages'],
    });

    if (!caseEntity) {
      throw new NotFoundException('Caso no encontrado');
    }

    if (!caseEntity.performanceMetrics) {
      throw new NotFoundException('Métricas de desempeño no encontradas para este caso');
    }

    const metrics = caseEntity.performanceMetrics;

    const nerviosismChart = (metrics.nerviosismStages ?? [])
      .map((stage) => ({
        stage: stage.stage,
        stageName: StageNames[stage.stage] || stage.stage,
        bpmValue: stage.bpmValue,
        levelLabel: stage.levelLabel,
        timestampSeconds: stage.timestampSeconds,
      }))
      .sort((a, b) => a.timestampSeconds - b.timestampSeconds); // Ordenar por timestamp para el gráfico

    return {
      caseId: caseEntity.id,
      caseNumber: caseEntity.caseNumber,
      fillerWords: metrics.fillerWords,
      interruptionsCount: metrics.interruptionsCount,
      totalTimeSeconds: metrics.totalTimeSeconds,
      heartRateBpm: metrics.heartRateBpm,
      nerviosismLevel: metrics.nerviosismLevel,
      nerviosismChart,
    };
  }

  public async getNerviosismChart(
    caseId: string,
    teacherId: string,
  ): Promise<NerviosismChartDto> {
    await this.ensureTeacherRole(teacherId);

    const caseEntity = await this.caseRepository.findOne({
      where: { id: caseId },
      relations: ['performanceMetrics', 'performanceMetrics.nerviosismStages'],
    });

    if (!caseEntity) {
      throw new NotFoundException('Caso no encontrado');
    }

    if (!caseEntity.performanceMetrics) {
      throw new NotFoundException('Métricas de desempeño no encontradas para este caso');
    }

    const stages = (caseEntity.performanceMetrics.nerviosismStages ?? [])
      .map((stage) => ({
        stage: stage.stage,
        stageName: StageNames[stage.stage] || stage.stage,
        bpmValue: stage.bpmValue,
        levelLabel: stage.levelLabel,
        timestampSeconds: stage.timestampSeconds,
      }))
      .sort((a, b) => a.timestampSeconds - b.timestampSeconds); // Ordenar por timestamp para el gráfico

    return {
      caseId: caseEntity.id,
      caseNumber: caseEntity.caseNumber,
      totalTimeSeconds: caseEntity.performanceMetrics.totalTimeSeconds,
      stages,
    };
  }

  public async createTextFeedback(
    dto: CreateTextFeedbackDto,
    teacherId: string,
  ): Promise<FeedbackResponseDto> {
    await this.ensureTeacherRole(teacherId);

    // Validar que el contenido no esté vacío después de trim (HU_6.3.1)
    const trimmedContent = dto.content.trim();
    if (trimmedContent.length < 300) {
      throw new BadRequestException(
        'El comentario debe tener al menos 300 caracteres (sin espacios en blanco al inicio o final)',
      );
    }

    const caseEntity = await this.caseRepository.findOne({ where: { id: dto.caseId } });

    if (!caseEntity) {
      throw new NotFoundException('Caso no encontrado');
    }

    const feedback = this.feedbackRepository.create({
      caseId: dto.caseId,
      teacherId,
      type: FeedbackType.Text,
      content: trimmedContent, // Guardar el contenido sin espacios al inicio/final
    });

    const savedFeedback = await this.feedbackRepository.save(feedback);

    return this.mapFeedbackToDto(savedFeedback);
  }

  public async createVoiceFeedback(
    dto: CreateVoiceFeedbackDto,
    teacherId: string,
  ): Promise<FeedbackResponseDto> {
    await this.ensureTeacherRole(teacherId);

    const caseEntity = await this.caseRepository.findOne({ where: { id: dto.caseId } });

    if (!caseEntity) {
      throw new NotFoundException('Caso no encontrado');
    }

    const feedback = this.feedbackRepository.create({
      caseId: dto.caseId,
      teacherId,
      type: FeedbackType.Voice,
      voiceUrl: dto.voiceUrl,
      voiceDurationSeconds: dto.voiceDurationSeconds,
    });

    const savedFeedback = await this.feedbackRepository.save(feedback);

    return this.mapFeedbackToDto(savedFeedback);
  }

  public async getStudentFeedback(
    studentId: string,
    teacherId: string,
  ): Promise<FeedbackResponseDto[]> {
    await this.ensureTeacherRole(teacherId);

    const cases = await this.caseRepository.find({
      where: { studentId },
    });

    const caseIds = cases.map((caseEntity) => caseEntity.id);

    if (caseIds.length === 0) {
      return [];
    }

    const feedbacks = await this.feedbackRepository.find({
      where: { caseId: In(caseIds) },
      order: { createdAt: 'DESC' },
    });

    return feedbacks.map((feedback) => this.mapFeedbackToDto(feedback));
  }

  public async getCaseFeedback(
    caseId: string,
    teacherId: string,
  ): Promise<FeedbackResponseDto[]> {
    await this.ensureTeacherRole(teacherId);

    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });

    if (!caseEntity) {
      throw new NotFoundException('Caso no encontrado');
    }

    const feedbacks = await this.feedbackRepository.find({
      where: { caseId },
      order: { createdAt: 'DESC' },
    });

    return feedbacks.map((feedback) => this.mapFeedbackToDto(feedback));
  }

  private async ensureTeacherRole(userId: string): Promise<void> {
    const teacher = await this.userRepository.findOne({
      where: { id: userId, role: UserRole.Teacher },
    });

    if (!teacher) {
      throw new ForbiddenException('Solo los profesores pueden acceder a esta información');
    }
  }

  // Métodos para Unity (VR APP) - Crear y actualizar casos y métricas

  public async createCase(
    dto: CreateCaseDto,
    studentId: string,
  ): Promise<{ caseId: string; caseNumber: number; status: CaseStatus }> {
    // Verificar que el usuario es estudiante
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.Student },
    });

    if (!student) {
      throw new ForbiddenException('Solo los estudiantes pueden crear casos');
    }

    // Verificar que no existe un caso en progreso para este estudiante
    const existingCase = await this.caseRepository.findOne({
      where: {
        studentId,
        status: CaseStatus.InProgress,
      },
    });

    if (existingCase) {
      throw new BadRequestException(
        'Ya existe un caso en progreso. Finaliza el caso actual antes de crear uno nuevo.',
      );
    }

    // Crear el caso
    const newCase = this.caseRepository.create({
      caseNumber: dto.caseNumber,
      studentId,
      status: CaseStatus.InProgress,
    });

    const savedCase = await this.caseRepository.save(newCase);

    return {
      caseId: savedCase.id,
      caseNumber: savedCase.caseNumber,
      status: savedCase.status,
    };
  }

  public async updateCaseStatus(
    caseId: string,
    dto: UpdateCaseStatusDto,
    studentId: string,
  ): Promise<{ caseId: string; status: CaseStatus }> {
    // Verificar que el usuario es estudiante
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.Student },
    });

    if (!student) {
      throw new ForbiddenException('Solo los estudiantes pueden actualizar casos');
    }

    // Buscar el caso
    const caseEntity = await this.caseRepository.findOne({
      where: { id: caseId, studentId },
    });

    if (!caseEntity) {
      throw new NotFoundException('Caso no encontrado o no pertenece al estudiante');
    }

    // Actualizar el estado
    caseEntity.status = dto.status;
    const updatedCase = await this.caseRepository.save(caseEntity);

    return {
      caseId: updatedCase.id,
      status: updatedCase.status,
    };
  }

  public async createPerformanceMetrics(
    dto: CreatePerformanceMetricsDto,
    studentId: string,
  ): Promise<{ metricsId: string; caseId: string }> {
    // Verificar que el usuario es estudiante
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.Student },
    });

    if (!student) {
      throw new ForbiddenException('Solo los estudiantes pueden crear métricas');
    }

    // Verificar que el caso existe y pertenece al estudiante
    const caseEntity = await this.caseRepository.findOne({
      where: { id: dto.caseId, studentId },
    });

    if (!caseEntity) {
      throw new NotFoundException('Caso no encontrado o no pertenece al estudiante');
    }

    // Verificar que no existen métricas para este caso
    const existingMetrics = await this.performanceMetricsRepository.findOne({
      where: { caseId: dto.caseId },
    });

    if (existingMetrics) {
      throw new BadRequestException('Ya existen métricas para este caso');
    }

    // Crear las métricas de desempeño
    const metrics = this.performanceMetricsRepository.create({
      caseId: dto.caseId,
      fillerWords: dto.fillerWords,
      interruptionsCount: dto.interruptionsCount,
      totalTimeSeconds: dto.totalTimeSeconds,
      heartRateBpm: dto.heartRateBpm,
      nerviosismLevel: dto.nerviosismLevel,
    });

    const savedMetrics = await this.performanceMetricsRepository.save(metrics);

    // Crear los datos de nerviosismo por etapas
    if (dto.nerviosismStages && dto.nerviosismStages.length > 0) {
      const stageDataEntities = dto.nerviosismStages.map((stage) =>
        this.nerviosismStageDataRepository.create({
          performanceMetricsId: savedMetrics.id,
          stage: stage.stage,
          bpmValue: stage.bpmValue,
          levelLabel: stage.levelLabel,
          timestampSeconds: stage.timestampSeconds,
        }),
      );

      await this.nerviosismStageDataRepository.save(stageDataEntities);
    }

    return {
      metricsId: savedMetrics.id,
      caseId: savedMetrics.caseId,
    };
  }

  public async updatePerformanceMetrics(
    caseId: string,
    dto: CreatePerformanceMetricsDto,
    studentId: string,
  ): Promise<{ metricsId: string; caseId: string }> {
    // Verificar que el usuario es estudiante
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.Student },
    });

    if (!student) {
      throw new ForbiddenException('Solo los estudiantes pueden actualizar métricas');
    }

    // Verificar que el caso existe y pertenece al estudiante
    const caseEntity = await this.caseRepository.findOne({
      where: { id: caseId, studentId },
    });

    if (!caseEntity) {
      throw new NotFoundException('Caso no encontrado o no pertenece al estudiante');
    }

    // Buscar métricas existentes
    let metrics = await this.performanceMetricsRepository.findOne({
      where: { caseId },
    });

    if (metrics) {
      // Actualizar métricas existentes
      metrics.fillerWords = dto.fillerWords;
      metrics.interruptionsCount = dto.interruptionsCount;
      metrics.totalTimeSeconds = dto.totalTimeSeconds;
      metrics.heartRateBpm = dto.heartRateBpm;
      metrics.nerviosismLevel = dto.nerviosismLevel;

      metrics = await this.performanceMetricsRepository.save(metrics);

      // Eliminar datos de nerviosismo anteriores
      await this.nerviosismStageDataRepository.delete({
        performanceMetricsId: metrics.id,
      });
    } else {
      // Crear nuevas métricas
      metrics = this.performanceMetricsRepository.create({
        caseId: dto.caseId,
        fillerWords: dto.fillerWords,
        interruptionsCount: dto.interruptionsCount,
        totalTimeSeconds: dto.totalTimeSeconds,
        heartRateBpm: dto.heartRateBpm,
        nerviosismLevel: dto.nerviosismLevel,
      });

      metrics = await this.performanceMetricsRepository.save(metrics);
    }

    // Crear/actualizar los datos de nerviosismo por etapas
    if (dto.nerviosismStages && dto.nerviosismStages.length > 0) {
      const stageDataEntities = dto.nerviosismStages.map((stage) =>
        this.nerviosismStageDataRepository.create({
          performanceMetricsId: metrics.id,
          stage: stage.stage,
          bpmValue: stage.bpmValue,
          levelLabel: stage.levelLabel,
          timestampSeconds: stage.timestampSeconds,
        }),
      );

      await this.nerviosismStageDataRepository.save(stageDataEntities);
    }

    return {
      metricsId: metrics.id,
      caseId: metrics.caseId,
    };
  }

  // Endpoint para estudiantes: Obtener sus retroalimentaciones filtradas por grupo
  public async getMyFeedbacks(studentId: string): Promise<StudentFeedbackItemDto[]> {
    // Verificar que el usuario es estudiante
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.Student },
      relations: ['groups'],
    });

    if (!student) {
      throw new ForbiddenException('Solo los estudiantes pueden acceder a sus retroalimentaciones');
    }

    // Obtener el grupo del estudiante
    if (!student.groups || student.groups.length === 0) {
      return []; // Si no tiene grupo, no hay feedbacks
    }

    const group = student.groups[0]; // Un estudiante solo puede estar en un grupo

    // Obtener todos los estudiantes del mismo grupo
    const groupWithStudents = await this.groupRepository.findOne({
      where: { id: group.id },
      relations: ['students'],
    });

    if (!groupWithStudents) {
      return [];
    }

    const groupStudentIds = groupWithStudents.students.map((s) => s.id);

    // Obtener todos los casos de los estudiantes del grupo
    const cases = await this.caseRepository.find({
      where: { studentId: In(groupStudentIds) },
    });

    if (cases.length === 0) {
      return [];
    }

    const caseIds = cases.map((c) => c.id);

    // Obtener todos los feedbacks de esos casos, con información del caso y del profesor
    const feedbacks = await this.feedbackRepository.find({
      where: { caseId: In(caseIds) },
      relations: ['case', 'teacher'],
      order: { createdAt: 'DESC' },
    });

    // Mapear a DTO con información del caso y del profesor
    return feedbacks.map((feedback) => ({
      feedbackId: feedback.id,
      caseId: feedback.caseId,
      caseNumber: feedback.case.caseNumber,
      teacherId: feedback.teacherId,
      teacherName: feedback.teacher.firstName,
      teacherLastName: feedback.teacher.lastName,
      type: feedback.type,
      content: feedback.content,
      voiceUrl: feedback.voiceUrl,
      voiceDurationSeconds: feedback.voiceDurationSeconds,
      createdAt: feedback.createdAt,
    }));
  }

  private mapFeedbackToDto(feedback: Feedback): FeedbackResponseDto {
    return {
      feedbackId: feedback.id,
      caseId: feedback.caseId,
      teacherId: feedback.teacherId,
      type: feedback.type,
      content: feedback.content,
      voiceUrl: feedback.voiceUrl,
      voiceDurationSeconds: feedback.voiceDurationSeconds,
      createdAt: feedback.createdAt,
    };
  }
}

