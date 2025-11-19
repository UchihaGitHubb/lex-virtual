import { NerviosismLevel } from '../../tracking/entities/performance-metrics.entity';

export class StudentCaseProgressDto {
  caseId: string;
  caseNumber: number;
  status: string;
  completedAt: Date | null;
  performanceMetrics: {
    fillerWords: string[];
    interruptionsCount: number;
    totalTimeSeconds: number;
    heartRateBpm: number | null;
    nerviosismLevel: NerviosismLevel;
  } | null;
  feedbacks: {
    feedbackId: string;
    type: 'text' | 'voice';
    content: string | null;
    voiceUrl: string | null;
    voiceDurationSeconds: number | null;
    createdAt: Date;
  }[];
}

