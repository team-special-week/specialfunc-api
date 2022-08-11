import { Module } from '@nestjs/common';
import { FunctionController } from './function.controller';
import { FunctionService } from './function.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FunctionEntity } from './entities/function.entity';
import { UserModule } from '../user/user.module';
import { ApplicationModule } from '../application/application.module';
import { RunnerModule } from '../runner/runner.module';

@Module({
  controllers: [FunctionController],
  providers: [FunctionService],
  imports: [
    TypeOrmModule.forFeature([FunctionEntity]),
    UserModule,
    ApplicationModule,
    RunnerModule,
  ],
  exports: [FunctionService],
})
export class FunctionModule {}
