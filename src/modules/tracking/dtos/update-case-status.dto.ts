import { IsEnum } from 'class-validator';
import { CaseStatus } from '../entities/case.entity';

export class UpdateCaseStatusDto {
  @IsEnum(CaseStatus)
  status: CaseStatus;
}

