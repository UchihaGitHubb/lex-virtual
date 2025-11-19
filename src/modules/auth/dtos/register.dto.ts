import { LoginDto } from './login.dto';
import { UserRole } from 'src/modules/users/entities/user.entity';
import { IsEnum, IsString, IsOptional, Length, Matches } from 'class-validator';

export class RegisterDto extends LoginDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsOptional()
  @Length(6, 8, { message: 'El código debe tener entre 6 y 8 caracteres' })
  @Matches(/^\d+$/, { message: 'El código debe ser numérico' })
  groupCode?: string;
}
