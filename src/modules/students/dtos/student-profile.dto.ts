export class StudentProfileDto {
  studentId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  casesCompleted: number;
  totalPracticeTime: number; // Tiempo total en segundos
  averageNerviosismLevel: string | null; // "low", "medium", "high" o null
  groupName: string | null;
  teacherName: string | null;
  teacherLastName: string | null;
  joinedAt: Date | null; // Fecha en que se unió al grupo
}

