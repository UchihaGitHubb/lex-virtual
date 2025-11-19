import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret'),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role?: string | null;
    roleConfirmed?: boolean;
  }) {
    // Verificar que el payload tenga los datos necesarios
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException(
        'Token inválido: datos de usuario faltantes',
      );
    }

    // Buscar el usuario en la base de datos
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Retornar los datos del usuario
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      roleConfirmed: user.roleConfirmed,
    };
  }
}
