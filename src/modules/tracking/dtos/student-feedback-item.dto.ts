import { FeedbackType } from '../entities/feedback.entity';

export class StudentFeedbackItemDto {
  feedbackId: string;
  caseId: string;
  caseNumber: number;
  teacherId: string;
  teacherName: string | null;
  teacherLastName: string | null;
  type: FeedbackType;
  content: string | null;
  voiceUrl: string | null;
  voiceDurationSeconds: number | null;
  createdAt: Date;
}

