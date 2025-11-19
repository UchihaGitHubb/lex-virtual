import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Case } from './case.entity';

export enum FeedbackType {
  Text = 'text',
  Voice = 'voice',
}

@Entity('feedback')
export class Feedback extends BaseEntity {
  @Column({ type: 'uuid', name: 'case_id' })
  caseId: string;

  @ManyToOne(() => Case)
  @JoinColumn({ name: 'case_id' })
  case: Case;

  @Column({ type: 'uuid', name: 'teacher_id' })
  teacherId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ type: 'enum', enum: FeedbackType })
  type: FeedbackType;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'voice_url' })
  voiceUrl: string | null;

  @Column({ type: 'int', nullable: true, name: 'voice_duration_seconds' })
  voiceDurationSeconds: number | null;
}

