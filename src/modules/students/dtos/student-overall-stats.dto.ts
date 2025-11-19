export class StudentOverallStatsDto {
  totalCases: number;
  completedCases: number;
  inProgressCases: number;
  totalPracticeTime: number; // Tiempo total en segundos
  averageTimePerCase: number | null; // Promedio en segundos
  totalFillerWords: number;
  averageFillerWordsPerCase: number | null;
  totalInterruptions: number;
  averageInterruptionsPerCase: number | null;
  nerviosismDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  nerviosismByStage: {
    introduction: {
      averageBpm: number | null;
      averageLevel: string | null;
    };
    testimony: {
      averageBpm: number | null;
      averageLevel: string | null;
    };
    objection: {
      averageBpm: number | null;
      averageLevel: string | null;
    };
    final_argument: {
      averageBpm: number | null;
      averageLevel: string | null;
    };
  };
  progressOverTime: {
    caseNumber: number;
    totalTimeSeconds: number;
    nerviosismLevel: string;
    completedAt: Date;
  }[];
}

