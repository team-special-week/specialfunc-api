import { forwardRef, Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationEntity } from './entities/application.entity';
import { UserModule } from '../user/user.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FunctionModule } from '../function/function.module';

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService],
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([ApplicationEntity]),
    UserModule,
    forwardRef(() => FunctionModule),
  ],
  exports: [ApplicationService],
})
export class ApplicationModule {}
