import { TrialStage } from '../entities/nerviosism-stage-data.entity';

export class NerviosismChartDto {
  caseId: string;
  caseNumber: number;
  totalTimeSeconds: number; // Tiempo total del caso para referencia
  stages: {
    stage: TrialStage;
    stageName: string; // Nombre legible de la etapa (HU_6.2.2)
    bpmValue: number | null; // Valor en BPM (HU_6.2.2)
    levelLabel: string | null; // Etiqueta: low/medium/high (HU_6.2.2)
    timestampSeconds: number; // Timestamp para el eje X del gráfico
  }[];
}

// Mapeo de etapas a nombres legibles
export const StageNames: Record<TrialStage, string> = {
  [TrialStage.Introduction]: 'Introducción',
  [TrialStage.Testimony]: 'Testimonio',
  [TrialStage.Objection]: 'Objeción',
  [TrialStage.FinalArgument]: 'Alegato final',
};

