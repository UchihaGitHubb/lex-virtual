import {
  IsString,
  IsArray,
  IsInt,
  IsEnum,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NerviosismLevel } from '../entities/performance-metrics.entity';
import { TrialStage } from '../entities/nerviosism-stage-data.entity';

export class NerviosismStageDataDto {
  @IsEnum(TrialStage)
  stage: TrialStage;

  @IsInt()
  @IsOptional()
  @Min(0)
  bpmValue: number | null;

  @IsString()
  @IsOptional()
  levelLabel: string | null;

  @IsInt()
  @Min(0)
  timestampSeconds: number;
}

export class CreatePerformanceMetricsDto {
  @IsString()
  caseId: string;

  @IsArray()
  @IsString({ each: true })
  fillerWords: string[];

  @IsInt()
  @Min(0)
  interruptionsCount: number;

  @IsInt()
  @Min(0)
  totalTimeSeconds: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  heartRateBpm: number | null;

  @IsEnum(NerviosismLevel)
  nerviosismLevel: NerviosismLevel;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NerviosismStageDataDto)
  nerviosismStages: NerviosismStageDataDto[];
}

