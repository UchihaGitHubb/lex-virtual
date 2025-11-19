export class StudentListItemDto {
  studentId: string;
  studentName: string;
  studentLastName: string;
  casesCompleted: number;
  lastCaseNumber: number | null;
  lastCaseTimeSeconds: number | null; // Tiempo del último caso completado (HU_6.2.1)
}

