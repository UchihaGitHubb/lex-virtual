import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { User } from '../users/entities/user.entity';
import { Case } from '../tracking/entities/case.entity';
import { PerformanceMetrics } from '../tracking/entities/performance-metrics.entity';
import { Feedback } from '../tracking/entities/feedback.entity';
import { Group } from '../groups/entities/group.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Case,
      PerformanceMetrics,
      Feedback,
      Group,
    ]),
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}

