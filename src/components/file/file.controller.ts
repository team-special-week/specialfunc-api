import {
  Controller,
  FileTypeValidator,
  Get,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseFilePipeBuilder,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FileService } from './file.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { IUserEntity } from '../user/interfaces/IUserEntity';
import { UploadFileNotFoundException } from './exceptions/file.exceptions';
import { Response } from 'express';
import * as path from 'path';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @CurrentUser() user: IUserEntity,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 15 }),
          new FileTypeValidator({ fileType: /jpg|jpeg|png|gif/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.fileService.uploadFile(user, file);
  }

  @Get('/download/:uuid')
  async downloadImage(@Param('uuid') uuid: string, @Res() res: Response) {
    const uploadFile = await this.fileService.findUploadFile(uuid);
    if (!uploadFile) {
      throw new UploadFileNotFoundException();
    }

    const sourcePath = path.join(
      __dirname,
      '../../../',
      'uploads',
      uploadFile.uuid,
    );
    res.download(sourcePath, uploadFile.originalName);
  }
}
