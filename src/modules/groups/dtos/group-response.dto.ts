export class GroupResponseDto {
  groupId: string;
  code: string;
  name: string | null;
  teacherId: string;
  teacherName: string | null;
  teacherLastName: string | null;
  studentsCount: number;
  createdAt: Date;
}

