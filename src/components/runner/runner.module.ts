import { forwardRef, Module } from '@nestjs/common';
import { RunnerService } from './runner.service';
import { FunctionModule } from '../function/function.module';

@Module({
  providers: [RunnerService],
  imports: [forwardRef(() => FunctionModule)],
  exports: [RunnerService],
})
export class RunnerModule {}
