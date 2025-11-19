import { IsString, Length, Matches } from 'class-validator';

export class JoinGroupDto {
  @IsString()
  @Length(6, 8, { message: 'El código debe tener entre 6 y 8 caracteres' })
  @Matches(/^\d+$/, { message: 'El código debe ser numérico' })
  code: string;
}

