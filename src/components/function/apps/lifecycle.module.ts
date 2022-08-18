import { forwardRef, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LifecycleService } from './lifecycle.service';
import { CacheDBModule } from '../../../libs/cache-db/cache-db.module';
import { RunnerModule } from '../../runner/runner.module';
import { FunctionModule } from '../function.module';

@Module({
  controllers: [],
  providers: [LifecycleService],
  imports: [
    ScheduleModule.forRoot(),
    CacheDBModule,
    RunnerModule,
    forwardRef(() => FunctionModule),
  ],
  exports: [LifecycleService],
})
export class LifecycleModule {}
