import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LifecycleService } from './lifecycle.service';

@Module({
  controllers: [],
  providers: [LifecycleService],
  imports: [ScheduleModule.forRoot()],
})
export class LifecycleModule {}
