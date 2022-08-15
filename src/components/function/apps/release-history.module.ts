import { Module } from '@nestjs/common';
import { ReleaseHistoryService } from './release-history.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleaseHistoryEntity } from '../entities/release-history.entity';
import { FunctionEntity } from '../entities/function.entity';

@Module({
  providers: [ReleaseHistoryService],
  imports: [TypeOrmModule.forFeature([ReleaseHistoryEntity, FunctionEntity])],
  exports: [ReleaseHistoryService],
})
export class ReleaseHistoryModule {}
