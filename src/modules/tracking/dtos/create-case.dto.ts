import { IsInt, Min } from 'class-validator';

export class CreateCaseDto {
  @IsInt()
  @Min(1)
  caseNumber: number;
}

