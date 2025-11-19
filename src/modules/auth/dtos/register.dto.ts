import { LoginDto } from './login.dto';
import { UserRole } from 'src/modules/users/entities/user.entity';
import { IsEnum } from 'class-validator';

export class RegisterDto extends LoginDto {
  @IsEnum(UserRole)
  role: UserRole;
}
