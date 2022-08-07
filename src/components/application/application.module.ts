import { Module } from '@nestjs/common';
import { ApplicationController } from './application.controller';
import { ApplicationService } from './application.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationEntity } from './entities/application.entity';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService],
  imports: [TypeOrmModule.forFeature([ApplicationEntity]), UserModule],
})
export class ApplicationModule {}
