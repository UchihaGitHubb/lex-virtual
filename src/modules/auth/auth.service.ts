import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto, RegisterDto } from './dtos';
import { WhoAmI } from './dtos/who-am-i.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private usersService: UsersService,
  ) {}

  public async whoAmI(user: WhoAmI): Promise<WhoAmI> {
    const foundUser = await this.usersService.findById(user.sub);
    if (!foundUser) throw new ForbiddenException('Usuario no encontrado');
    return {
      sub: foundUser.id,
      email: foundUser.email,
      role: foundUser.role || null,
      roleConfirmed: foundUser.roleConfirmed,
    };
  }

  public async register(dto: RegisterDto) {
    // Verificar si el usuario ya existe
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    // Validar que el email no esté vacío
    if (!dto.email || !dto.password) {
      throw new BadRequestException('Email y contraseña son requeridos');
    }

    // Encriptar la contraseña
    const saltRounds = 10;
    const hash = await bcrypt.hash(dto.password, saltRounds);

    // Crear el usuario
    const user = await this.usersService.create(dto.email, hash);

    // Generar token JWT
    const token = this.jwt.sign(this.getPayload(user));

    return {
      message: 'Usuario registrado exitosamente',
      access_token: token,
    };
  }

  public async validateUser(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (
      user &&
      user.isActive &&
      (await bcrypt.compare(password, user.passwordHash))
    ) {
      return user;
    }
    return null;
  }

  public async login(dto: LoginDto) {
    // Validar que los campos no estén vacíos
    if (!dto.email || !dto.password) {
      throw new BadRequestException('Email y contraseña son requeridos');
    }

    // Buscar y validar el usuario
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      this.handlerUserNotFound();
    }

    // Generar token JWT
    const token = this.jwt.sign(this.getPayload(user!));

    return {
      message: 'Login exitoso',
      access_token: token,
    };
  }

  private handlerUserNotFound() {
    throw new UnauthorizedException(
      'Credenciales inválidas. Verifica tu email y contraseña',
    );
  }

  private getPayload(user: User) {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      roleConfirmed: user.roleConfirmed,
    };
  }
}
