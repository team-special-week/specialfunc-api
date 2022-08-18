import { Module } from '@nestjs/common';
import { RunnerService } from './runner.service';
import { ReleaseHistoryModule } from '../function/apps/release-history.module';

@Module({
  providers: [RunnerService],
  imports: [ReleaseHistoryModule],
  exports: [RunnerService],
})
export class RunnerModule {}
