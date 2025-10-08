import { Entity, Column } from 'typeorm';
import { BaseEntity } from 'src/database/entities/base.entity';

export enum UserRole {
  Student = 'student',
  Teacher = 'teacher',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true, name: 'email' })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, nullable: true, name: 'role' })
  role?: UserRole;

  @Column({ default: false, name: 'role_confirmed' })
  roleConfirmed: boolean;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;
}
