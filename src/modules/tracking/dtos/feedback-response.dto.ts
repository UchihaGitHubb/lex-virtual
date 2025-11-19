import { FeedbackType } from '../entities/feedback.entity';

export class FeedbackResponseDto {
  feedbackId: string;
  caseId: string;
  teacherId: string;
  type: FeedbackType;
  content: string | null;
  voiceUrl: string | null;
  voiceDurationSeconds: number | null;
  createdAt: Date;
}

