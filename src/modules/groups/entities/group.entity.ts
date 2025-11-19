import { Entity, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from 'src/database/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('groups')
export class Group extends BaseEntity {
  @Column({ unique: true, length: 8, name: 'code' })
  code: string;

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'name' })
  name: string | null;

  @Column({ type: 'uuid', name: 'teacher_id' })
  teacherId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @ManyToMany(() => User, (user) => user.groups)
  @JoinTable({
    name: 'group_students',
    joinColumn: { name: 'group_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'student_id', referencedColumnName: 'id' },
  })
  students: User[];
}

