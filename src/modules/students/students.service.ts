import {
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Case, CaseStatus } from '../tracking/entities/case.entity';
import { PerformanceMetrics, NerviosismLevel } from '../tracking/entities/performance-metrics.entity';
import { Feedback } from '../tracking/entities/feedback.entity';
import { Group } from '../groups/entities/group.entity';
import {
  StudentProfileDto,
  StudentCaseProgressDto,
  StudentOverallStatsDto,
} from './dtos';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(PerformanceMetrics)
    private performanceMetricsRepository: Repository<PerformanceMetrics>,
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
  ) {}

  async getMyProfile(studentId: string): Promise<StudentProfileDto> {
    // Verificar que el usuario es estudiante
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.Student },
      relations: ['groups', 'groups.teacher'],
    });

    if (!student) {
      throw new ForbiddenException('Solo los estudiantes pueden acceder a su perfil');
    }

    // Obtener casos completados
    const completedCases = await this.caseRepository.find({
      where: {
        studentId,
        status: CaseStatus.Completed,
      },
      relations: ['performanceMetrics'],
    });

    // Calcular tiempo total de práctica
    const totalPracticeTime = completedCases.reduce((total, caseEntity) => {
      return total + (caseEntity.performanceMetrics?.totalTimeSeconds || 0);
    }, 0);

    // Calcular nivel promedio de nerviosismo
    const nerviosismLevels = completedCases
      .map((c) => c.performanceMetrics?.nerviosismLevel)
      .filter((level): level is NerviosismLevel => level !== undefined);

    let averageNerviosismLevel: string | null = null;
    if (nerviosismLevels.length > 0) {
      const lowCount = nerviosismLevels.filter((l) => l === NerviosismLevel.Low).length;
      const mediumCount = nerviosismLevels.filter((l) => l === NerviosismLevel.Medium).length;
      const highCount = nerviosismLevels.filter((l) => l === NerviosismLevel.High).length;

      if (highCount >= mediumCount && highCount >= lowCount) {
        averageNerviosismLevel = NerviosismLevel.High;
      } else if (mediumCount >= lowCount) {
        averageNerviosismLevel = NerviosismLevel.Medium;
      } else {
        averageNerviosismLevel = NerviosismLevel.Low;
      }
    }

    // Obtener información del grupo
    const group = student.groups && student.groups.length > 0 ? student.groups[0] : null;

    return {
      studentId: student.id,
      email: student.email,
      firstName: student.firstName,
      lastName: student.lastName,
      casesCompleted: completedCases.length,
      totalPracticeTime,
      averageNerviosismLevel,
      groupName: group?.name || null,
      teacherName: group?.teacher?.firstName || null,
      teacherLastName: group?.teacher?.lastName || null,
      joinedAt: group?.createdAt || null,
    };
  }

  async getMyCases(studentId: string): Promise<StudentCaseProgressDto[]> {
    // Verificar que el usuario es estudiante
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.Student },
    });

    if (!student) {
      throw new ForbiddenException('Solo los estudiantes pueden acceder a sus casos');
    }

    // Obtener todos los casos del estudiante
    const cases = await this.caseRepository.find({
      where: { studentId },
      relations: ['performanceMetrics'],
      order: { caseNumber: 'DESC', createdAt: 'DESC' },
    });

    // Obtener feedbacks de todos los casos
    const caseIds = cases.map((c) => c.id);
    const feedbacks = caseIds.length > 0
      ? await this.feedbackRepository.find({
          where: { caseId: In(caseIds) },
          relations: ['teacher'],
          order: { createdAt: 'DESC' },
        })
      : [];

    // Agrupar feedbacks por caso
    const feedbacksByCase = feedbacks.reduce((acc, feedback) => {
      if (!acc[feedback.caseId]) {
        acc[feedback.caseId] = [];
      }
      acc[feedback.caseId].push(feedback);
      return acc;
    }, {} as Record<string, Feedback[]>);

    // Mapear a DTO
    return cases.map((caseEntity) => ({
      caseId: caseEntity.id,
      caseNumber: caseEntity.caseNumber,
      status: caseEntity.status,
      completedAt:
        caseEntity.status === CaseStatus.Completed ? caseEntity.updatedAt : null,
      performanceMetrics: caseEntity.performanceMetrics
        ? {
            fillerWords: caseEntity.performanceMetrics.fillerWords,
            interruptionsCount: caseEntity.performanceMetrics.interruptionsCount,
            totalTimeSeconds: caseEntity.performanceMetrics.totalTimeSeconds,
            heartRateBpm: caseEntity.performanceMetrics.heartRateBpm,
            nerviosismLevel: caseEntity.performanceMetrics.nerviosismLevel,
          }
        : null,
      feedbacks: (feedbacksByCase[caseEntity.id] || []).map((feedback) => ({
        feedbackId: feedback.id,
        type: feedback.type,
        content: feedback.content,
        voiceUrl: feedback.voiceUrl,
        voiceDurationSeconds: feedback.voiceDurationSeconds,
        createdAt: feedback.createdAt,
      })),
    }));
  }

  async getMyStats(studentId: string): Promise<StudentOverallStatsDto> {
    // Verificar que el usuario es estudiante
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.Student },
    });

    if (!student) {
      throw new ForbiddenException('Solo los estudiantes pueden acceder a sus estadísticas');
    }

    // Obtener todos los casos
    const allCases = await this.caseRepository.find({
      where: { studentId },
      relations: ['performanceMetrics', 'performanceMetrics.nerviosismStages'],
      order: { caseNumber: 'ASC', createdAt: 'ASC' },
    });

    const completedCases = allCases.filter(
      (c) => c.status === CaseStatus.Completed && c.performanceMetrics,
    );

    const inProgressCases = allCases.filter((c) => c.status === CaseStatus.InProgress);

    // Calcular estadísticas generales
    const totalPracticeTime = completedCases.reduce(
      (total, c) => total + (c.performanceMetrics!.totalTimeSeconds || 0),
      0,
    );

    const averageTimePerCase =
      completedCases.length > 0 ? totalPracticeTime / completedCases.length : null;

    const totalFillerWords = completedCases.reduce(
      (total, c) => total + (c.performanceMetrics!.fillerWords?.length || 0),
      0,
    );

    const averageFillerWordsPerCase =
      completedCases.length > 0 ? totalFillerWords / completedCases.length : null;

    const totalInterruptions = completedCases.reduce(
      (total, c) => total + (c.performanceMetrics!.interruptionsCount || 0),
      0,
    );

    const averageInterruptionsPerCase =
      completedCases.length > 0 ? totalInterruptions / completedCases.length : null;

    // Distribución de nerviosismo
    const nerviosismDistribution = {
      low: completedCases.filter(
        (c) => c.performanceMetrics!.nerviosismLevel === NerviosismLevel.Low,
      ).length,
      medium: completedCases.filter(
        (c) => c.performanceMetrics!.nerviosismLevel === NerviosismLevel.Medium,
      ).length,
      high: completedCases.filter(
        (c) => c.performanceMetrics!.nerviosismLevel === NerviosismLevel.High,
      ).length,
    };

    // Nerviosismo por etapa
    const stagesData = {
      introduction: { bpmValues: [] as number[], levels: [] as string[] },
      testimony: { bpmValues: [] as number[], levels: [] as string[] },
      objection: { bpmValues: [] as number[], levels: [] as string[] },
      final_argument: { bpmValues: [] as number[], levels: [] as string[] },
    };

    completedCases.forEach((caseEntity) => {
      if (caseEntity.performanceMetrics?.nerviosismStages) {
        caseEntity.performanceMetrics.nerviosismStages.forEach((stage) => {
          const stageKey = stage.stage as keyof typeof stagesData;
          if (stage.bpmValue !== null) {
            stagesData[stageKey].bpmValues.push(stage.bpmValue);
          }
          if (stage.levelLabel) {
            stagesData[stageKey].levels.push(stage.levelLabel);
          }
        });
      }
    });

    const calculateAverageBpm = (values: number[]): number | null => {
      return values.length > 0
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : null;
    };

    const calculateAverageLevel = (levels: string[]): string | null => {
      if (levels.length === 0) return null;
      const lowCount = levels.filter((l) => l === 'low').length;
      const mediumCount = levels.filter((l) => l === 'medium').length;
      const highCount = levels.filter((l) => l === 'high').length;

      if (highCount >= mediumCount && highCount >= lowCount) return 'high';
      if (mediumCount >= lowCount) return 'medium';
      return 'low';
    };

    const nerviosismByStage = {
      introduction: {
        averageBpm: calculateAverageBpm(stagesData.introduction.bpmValues),
        averageLevel: calculateAverageLevel(stagesData.introduction.levels),
      },
      testimony: {
        averageBpm: calculateAverageBpm(stagesData.testimony.bpmValues),
        averageLevel: calculateAverageLevel(stagesData.testimony.levels),
      },
      objection: {
        averageBpm: calculateAverageBpm(stagesData.objection.bpmValues),
        averageLevel: calculateAverageLevel(stagesData.objection.levels),
      },
      final_argument: {
        averageBpm: calculateAverageBpm(stagesData.final_argument.bpmValues),
        averageLevel: calculateAverageLevel(stagesData.final_argument.levels),
      },
    };

    // Progreso a lo largo del tiempo
    const progressOverTime = completedCases.map((caseEntity) => ({
      caseNumber: caseEntity.caseNumber,
      totalTimeSeconds: caseEntity.performanceMetrics!.totalTimeSeconds,
      nerviosismLevel: caseEntity.performanceMetrics!.nerviosismLevel,
      completedAt: caseEntity.updatedAt,
    }));

    return {
      totalCases: allCases.length,
      completedCases: completedCases.length,
      inProgressCases: inProgressCases.length,
      totalPracticeTime,
      averageTimePerCase,
      totalFillerWords,
      averageFillerWordsPerCase,
      totalInterruptions,
      averageInterruptionsPerCase,
      nerviosismDistribution,
      nerviosismByStage,
      progressOverTime,
    };
  }
}

