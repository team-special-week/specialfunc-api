import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LifecycleService } from './lifecycle.service';
import { CacheDBModule } from '../../../libs/cache-db/cache-db.module';
import { RunnerModule } from '../../runner/runner.module';

@Module({
  controllers: [],
  providers: [LifecycleService],
  imports: [ScheduleModule.forRoot(), CacheDBModule, RunnerModule],
})
export class LifecycleModule {}
