import { LoginDto } from './login.dto';
import { UserRole } from 'src/modules/users/entities/user.entity';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterDto extends LoginDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'El apellido debe ser un texto' })
  @MaxLength(100, { message: 'El apellido no puede exceder 100 caracteres' })
  lastName?: string;
}
