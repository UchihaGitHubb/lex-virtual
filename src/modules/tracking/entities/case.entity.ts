import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from 'src/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { PerformanceMetrics } from './performance-metrics.entity';

export enum CaseStatus {
  InProgress = 'in_progress',
  Completed = 'completed',
}

@Entity('cases')
export class Case extends BaseEntity {
  @Column({ name: 'case_number', type: 'int' })
  caseNumber: number;

  @Column({ type: 'enum', enum: CaseStatus, default: CaseStatus.InProgress })
  status: CaseStatus;

  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @OneToOne(() => PerformanceMetrics, (metrics) => metrics.case)
  performanceMetrics?: PerformanceMetrics;
}

