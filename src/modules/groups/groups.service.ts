import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { User, UserRole } from '../users/entities/user.entity';
import {
  CreateGroupDto,
  GroupResponseDto,
  JoinGroupDto,
  GroupInfoDto,
} from './dtos';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createGroup(
    dto: CreateGroupDto,
    teacherId: string,
  ): Promise<GroupResponseDto> {
    // Verificar que el usuario es profesor
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: UserRole.Teacher },
    });

    if (!teacher) {
      throw new ForbiddenException('Solo los profesores pueden crear grupos');
    }

    // Generar código único de 6-8 caracteres numéricos
    const code = await this.generateUniqueCode();

    // Crear el grupo
    const group = this.groupRepository.create({
      code,
      name: dto.name || null,
      teacherId,
    });

    const savedGroup = await this.groupRepository.save(group);

    // Cargar relaciones
    await this.groupRepository.findOne({
      where: { id: savedGroup.id },
      relations: ['teacher', 'students'],
    });

    return {
      groupId: savedGroup.id,
      code: savedGroup.code,
      name: savedGroup.name,
      teacherId: savedGroup.teacherId,
      teacherName: teacher.firstName,
      teacherLastName: teacher.lastName,
      studentsCount: 0,
      createdAt: savedGroup.createdAt,
    };
  }

  async validateGroupCode(code: string): Promise<GroupInfoDto> {
    const group = await this.groupRepository.findOne({
      where: { code },
      relations: ['teacher'],
    });

    if (!group) {
      throw new NotFoundException('Este código no existe');
    }

    return {
      groupId: group.id,
      code: group.code,
      name: group.name,
      teacherId: group.teacherId,
      teacherName: group.teacher.firstName,
      teacherLastName: group.teacher.lastName,
    };
  }

  async joinGroup(dto: JoinGroupDto, studentId: string): Promise<GroupInfoDto> {
    // Verificar que el usuario es estudiante
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.Student },
      relations: ['groups'],
    });

    if (!student) {
      throw new ForbiddenException('Solo los estudiantes pueden unirse a grupos');
    }

    // Validar que el código existe
    const group = await this.groupRepository.findOne({
      where: { code: dto.code },
      relations: ['teacher', 'students'],
    });

    if (!group) {
      throw new NotFoundException('Este código no existe');
    }

    // Verificar que el estudiante no esté ya en el grupo
    const isAlreadyInGroup = group.students.some((s) => s.id === studentId);
    if (isAlreadyInGroup) {
      throw new ConflictException('Ya estás en este grupo');
    }

    // Agregar estudiante al grupo
    group.students.push(student);
    await this.groupRepository.save(group);

    return {
      groupId: group.id,
      code: group.code,
      name: group.name,
      teacherId: group.teacherId,
      teacherName: group.teacher.firstName,
      teacherLastName: group.teacher.lastName,
    };
  }

  async getMyGroup(userId: string): Promise<GroupResponseDto | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['groups', 'groups.teacher', 'groups.students'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Si es profesor, obtener el grupo que creó
    if (user.role === UserRole.Teacher) {
      const group = await this.groupRepository.findOne({
        where: { teacherId: userId },
        relations: ['teacher', 'students'],
      });

      if (!group) {
        return null;
      }

      return {
        groupId: group.id,
        code: group.code,
        name: group.name,
        teacherId: group.teacherId,
        teacherName: group.teacher.firstName,
        teacherLastName: group.teacher.lastName,
        studentsCount: group.students.length,
        createdAt: group.createdAt,
      };
    }

    // Si es estudiante, obtener el primer grupo al que pertenece
    if (user.role === UserRole.Student && user.groups && user.groups.length > 0) {
      const group = user.groups[0];
      return {
        groupId: group.id,
        code: group.code,
        name: group.name,
        teacherId: group.teacherId,
        teacherName: group.teacher.firstName,
        teacherLastName: group.teacher.lastName,
        studentsCount: group.students.length,
        createdAt: group.createdAt,
      };
    }

    return null;
  }

  private async generateUniqueCode(): Promise<string> {
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!isUnique && attempts < maxAttempts) {
      // Generar código de 6-8 dígitos (aleatorio entre 6 y 8)
      const length = Math.floor(Math.random() * 3) + 6; // 6, 7 u 8
      code = this.generateNumericCode(length);

      // Verificar que no exista
      const existing = await this.groupRepository.findOne({
        where: { code },
      });

      if (!existing) {
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) {
      throw new BadRequestException(
        'No se pudo generar un código único. Intenta nuevamente.',
      );
    }

    return code!;
  }

  private generateNumericCode(length: number): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    const code = Math.floor(Math.random() * (max - min + 1)) + min;
    return code.toString();
  }
}

