import { forwardRef, Module } from '@nestjs/common';
import { FunctionController } from './function.controller';
import { FunctionService } from './function.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FunctionEntity } from './entities/function.entity';
import { UserModule } from '../user/user.module';
import { ApplicationModule } from '../application/application.module';
import { RunnerModule } from '../runner/runner.module';
import { MulterModule } from '@nestjs/platform-express';
import * as path from 'path';
import { ReleaseHistoryModule } from './apps/release-history.module';
import { LifecycleModule } from './apps/lifecycle.module';

@Module({
  controllers: [FunctionController],
  providers: [FunctionService],
  imports: [
    TypeOrmModule.forFeature([FunctionEntity]),
    UserModule,
    forwardRef(() => ApplicationModule),
    RunnerModule,
    MulterModule.register({
      dest: path.join(__dirname, '../../../', 'tmp'),
    }),
    ReleaseHistoryModule,
    forwardRef(() => LifecycleModule),
  ],
  exports: [FunctionService],
})
export class FunctionModule {}
