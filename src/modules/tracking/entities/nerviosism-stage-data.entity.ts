import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/database/entities/base.entity';
import { PerformanceMetrics } from './performance-metrics.entity';

export enum TrialStage {
  Introduction = 'introduction',
  Testimony = 'testimony',
  Objection = 'objection',
  FinalArgument = 'final_argument',
}

@Entity('nerviosism_stage_data')
export class NerviosismStageData extends BaseEntity {
  @Column({ type: 'uuid', name: 'performance_metrics_id' })
  performanceMetricsId: string;

  @ManyToOne(() => PerformanceMetrics, (metrics) => metrics.nerviosismStages)
  @JoinColumn({ name: 'performance_metrics_id' })
  performanceMetrics: PerformanceMetrics;

  @Column({ type: 'enum', enum: TrialStage })
  stage: TrialStage;

  @Column({ type: 'int', nullable: true, name: 'bpm_value' })
  bpmValue: number | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'level_label',
  })
  levelLabel: string | null;

  @Column({ type: 'int', name: 'timestamp_seconds' })
  timestampSeconds: number;
}

