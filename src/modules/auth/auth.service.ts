import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/entities/user.entity';
import { GroupsService } from '../groups/groups.service';
import {
  LoginDto,
  RegisterDto,
  WhoAmI,
  RegisterResponseDto,
  LoginResponseDto,
} from './dtos';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private usersService: UsersService,
    private groupsService: GroupsService,
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

  public async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    // Verificar si el usuario ya existe
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este email');
    }

    // Validar que el email no esté vacío
    if (!dto.email || !dto.password) {
      throw new BadRequestException('Email y contraseña son requeridos');
    }

    // HU_6.4.2: Si es estudiante y tiene código de grupo, validarlo
    if (dto.role === UserRole.Student && dto.groupCode) {
      try {
        await this.groupsService.validateGroupCode(dto.groupCode);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw new BadRequestException('Este código no existe');
        }
        throw error;
      }
    }

    // Encriptar la contraseña
    const saltRounds = 10;
    const hash = await bcrypt.hash(dto.password, saltRounds);

    // Crear el usuario
    const user = await this.usersService.create(dto.email, hash, dto.role);

    // HU_6.4.2: Si es estudiante y tiene código de grupo, vincularlo automáticamente
    if (dto.role === UserRole.Student && dto.groupCode) {
      try {
        await this.groupsService.joinGroup({ code: dto.groupCode }, user.id);
      } catch (error) {
        // Si falla la vinculación, no impedimos el registro pero lo registramos
        console.error('Error al vincular estudiante al grupo:', error);
      }
    }

    // Generar token JWT
    const token = this.jwt.sign(this.getPayload(user));

    return {
      message: 'Usuario registrado exitosamente',
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || null,
        roleConfirmed: user.roleConfirmed,
      },
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
    throw new UnauthorizedException('Credenciales inválidas');
  }

  public async login(dto: LoginDto): Promise<LoginResponseDto> {
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
      accessToken: token,
      user: {
        id: user!.id,
        email: user!.email,
        role: user!.role || null,
        roleConfirmed: user!.roleConfirmed,
      },
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
