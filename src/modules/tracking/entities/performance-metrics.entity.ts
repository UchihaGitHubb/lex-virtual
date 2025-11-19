import { Entity, Column, ManyToOne, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/database/entities/base.entity';
import { Case } from './case.entity';
import { NerviosismStageData } from './nerviosism-stage-data.entity';

export enum NerviosismLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

@Entity('performance_metrics')
export class PerformanceMetrics extends BaseEntity {
  @Column({ type: 'uuid', name: 'case_id', unique: true })
  caseId: string;

  @OneToOne(() => Case, (caseEntity) => caseEntity.performanceMetrics)
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column({ type: 'text', array: true, default: [], name: 'filler_words' })
  fillerWords: string[];

  @Column({ type: 'int', default: 0, name: 'interruptions_count' })
  interruptionsCount: number;

  @Column({ type: 'int', name: 'total_time_seconds' })
  totalTimeSeconds: number;

  @Column({ type: 'int', name: 'heart_rate_bpm', nullable: true })
  heartRateBpm: number | null;

  @Column({
    type: 'enum',
    enum: NerviosismLevel,
    default: NerviosismLevel.Low,
    name: 'nerviosism_level',
  })
  nerviosismLevel: NerviosismLevel;

  @OneToMany(() => NerviosismStageData, (stageData) => stageData.performanceMetrics)
  nerviosismStages: NerviosismStageData[];
}

