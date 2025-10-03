import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Si hay un error o no hay usuario, lanzar excepción
    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Token expirado. Por favor, inicia sesión nuevamente',
        );
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Token inválido');
      }
      throw new UnauthorizedException('No autorizado. Token requerido');
    }
    return user;
  }
}
