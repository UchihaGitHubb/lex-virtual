import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { Case } from './entities/case.entity';
import { PerformanceMetrics } from './entities/performance-metrics.entity';
import { NerviosismStageData } from './entities/nerviosism-stage-data.entity';
import { Feedback } from './entities/feedback.entity';
import { User } from '../users/entities/user.entity';
import { Group } from '../groups/entities/group.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Case,
      PerformanceMetrics,
      NerviosismStageData,
      Feedback,
      User,
      Group,
    ]),
  ],
  controllers: [TrackingController],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}

