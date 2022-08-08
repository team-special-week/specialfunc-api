import { Module } from '@nestjs/common';
import { FunctionController } from './function.controller';
import { FunctionService } from './function.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FunctionEntity } from './entities/function.entity';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [FunctionController],
  providers: [FunctionService],
  imports: [TypeOrmModule.forFeature([FunctionEntity]), UserModule],
})
export class FunctionModule {}
