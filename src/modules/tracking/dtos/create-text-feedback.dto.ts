import { IsString, MinLength, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateTextFeedbackDto {
  @IsString()
  @IsNotEmpty({ message: 'El comentario no puede estar vacío' })
  @MinLength(300, { message: 'El comentario debe tener al menos 300 caracteres' })
  content: string;

  @IsString()
  @IsUUID(4, { message: 'El ID del caso debe ser un UUID válido' })
  caseId: string;
}

