import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async create(email: string, passwordHash: string) {
    const user = this.repo.create({ email, passwordHash });
    return this.repo.save(user);
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async selectRole(userId: string, role: string) {
    const user = await this.findById(userId);
    if (!user) throw new BadRequestException('User not found');
    if (user.roleConfirmed) throw new BadRequestException('Role already confirmed');
    if (!(role in UserRole)) throw new BadRequestException('Invalid role');
    user.role = role as UserRole;
    return this.repo.save(user);
  }

  async confirmRole(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new BadRequestException('User not found');
    if (!user.role) throw new BadRequestException('Select role first');
    if (user.roleConfirmed) throw new BadRequestException('Already confirmed');
    user.roleConfirmed = true;
    return this.repo.save(user);
  }
}
