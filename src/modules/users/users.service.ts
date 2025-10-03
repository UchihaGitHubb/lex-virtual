import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  public async create(email: string, passwordHash: string) {
    const user = this.userRepository.create({ email, passwordHash });
    return this.userRepository.save(user);
  }

  public async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  public async findById(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  public async selectRole(userId: string, role: UserRole) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.roleConfirmed)
      throw new ConflictException('Role already confirmed');

    user.role = role;
    return this.userRepository.save(user);
  }

  public async confirmRole(userId: string) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.role) throw new BadRequestException('Select role first');
    if (user.roleConfirmed) throw new ConflictException('Already confirmed');
    user.roleConfirmed = true;
    return this.userRepository.save(user);
  }
}
