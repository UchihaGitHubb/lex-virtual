import { NerviosismLevel } from '../entities/performance-metrics.entity';

export class StudentDetailsDto {
  studentId: string;
  studentName: string;
  studentLastName: string;
  casesCompleted: number;
  performanceMetrics: {
    caseId: string; // ID del caso para poder acceder a los detalles
    caseNumber: number; // Número del caso
    fillerWords: string[];
    interruptionsCount: number;
    totalTimeSeconds: number; // Tiempo de completación (HU_6.2.1)
    heartRateBpm: number | null;
    nerviosismLevel: NerviosismLevel;
  }[];
}

