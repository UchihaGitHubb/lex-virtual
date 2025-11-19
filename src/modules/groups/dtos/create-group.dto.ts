import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;
}

