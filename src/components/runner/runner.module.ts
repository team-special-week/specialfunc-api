import { forwardRef, Module } from '@nestjs/common';
import { RunnerService } from './runner.service';
import { FunctionModule } from '../function/function.module';
import { ReleaseHistoryModule } from '../function/apps/release-history.module';

@Module({
  providers: [RunnerService],
  imports: [forwardRef(() => FunctionModule), ReleaseHistoryModule],
  exports: [RunnerService],
})
export class RunnerModule {}
