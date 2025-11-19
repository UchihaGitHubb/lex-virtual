import { IsString, IsInt, Min, Max, IsNotEmpty, IsUUID, IsUrl } from 'class-validator';

export class CreateVoiceFeedbackDto {
  @IsString()
  @IsUUID(4, { message: 'El ID del caso debe ser un UUID válido' })
  caseId: string;

  @IsString()
  @IsNotEmpty({ message: 'La URL del audio es requerida' })
  @IsUrl({}, { message: 'La URL del audio debe ser una URL válida' })
  voiceUrl: string;

  @IsInt()
  @Min(1, { message: 'La duración debe ser al menos 1 segundo' })
  @Max(60, { message: 'La grabación no puede exceder 60 segundos' })
  voiceDurationSeconds: number;
}

