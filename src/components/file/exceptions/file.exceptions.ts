import { HttpException, HttpStatus } from '@nestjs/common';
import { ESPFuncStatusCode } from '../../../common/enums/ESPFuncStatusCode';

export class UploadFileNotFoundException extends HttpException {
  constructor() {
    super(
      {
        status: ESPFuncStatusCode.UPLOAD_FILE_NOT_FOUND,
        message: 'Upload file not found',
        data: {},
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
