import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from 'src/database/entities/base.entity';
import { Group } from '../../groups/entities/group.entity';

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

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'first_name' })
  firstName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'last_name' })
  lastName: string | null;

  @Column({ type: 'enum', enum: UserRole, nullable: true, name: 'role' })
  role?: UserRole;

  @Column({ default: false, name: 'role_confirmed' })
  roleConfirmed: boolean;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @ManyToMany(() => Group, (group) => group.students)
  groups: Group[];
}
