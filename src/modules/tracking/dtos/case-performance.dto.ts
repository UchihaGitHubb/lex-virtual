import { NerviosismLevel } from '../entities/performance-metrics.entity';
import { TrialStage } from '../entities/nerviosism-stage-data.entity';

export class CasePerformanceDto {
  caseId: string;
  caseNumber: number;
  fillerWords: string[];
  interruptionsCount: number;
  totalTimeSeconds: number; // Tiempo de completación (HU_6.2.1)
  heartRateBpm: number | null;
  nerviosismLevel: NerviosismLevel;
  nerviosismChart: {
    stage: TrialStage;
    stageName: string; // Nombre legible de la etapa (HU_6.2.2)
    bpmValue: number | null; // Valor en BPM (HU_6.2.2)
    levelLabel: string | null; // Etiqueta: low/medium/high (HU_6.2.2)
    timestampSeconds: number; // Timestamp para el eje X del gráfico
  }[];
}

