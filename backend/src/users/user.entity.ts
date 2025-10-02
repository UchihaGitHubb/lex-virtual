import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum UserRole {
  Student = 'Student',
  Teacher = 'Teacher',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, nullable: true })
  role: UserRole | null;

  @Column({ default: false })
  roleConfirmed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
