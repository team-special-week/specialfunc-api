import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { MulterModule } from '@nestjs/platform-express';
import * as path from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { UploadFileEntity } from './entities/upload-file.entity';

@Module({
  controllers: [FileController],
  providers: [FileService],
  imports: [
    TypeOrmModule.forFeature([UploadFileEntity]),
    MulterModule.register({
      dest: path.join(__dirname, '../../../', 'uploads'),
    }),
    UserModule,
  ],
})
export class FileModule {}
