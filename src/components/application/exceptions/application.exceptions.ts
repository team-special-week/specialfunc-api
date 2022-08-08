import { HttpException, HttpStatus } from '@nestjs/common';
import { ESPFuncStatusCode } from 'src/common/enums/ESPFuncStatusCode';

export class ExceedApplicationCountException extends HttpException {
  constructor() {
    super(
      {
        status: ESPFuncStatusCode.EXCEED_APPLICATION_COUNT,
        message: 'Exceed application count',
        data: {},
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class EndpointAlreadyExistsException extends HttpException {
  constructor() {
    super(
      {
        status: ESPFuncStatusCode.ENDPOINT_ALREADY_EXIST,
        message: 'Endpoint already exist',
        data: {},
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class ApplicationNotFoundException extends HttpException {
  constructor() {
    super(
      {
        status: ESPFuncStatusCode.APP_NOT_FOUND,
        message: 'Application not found',
        data: {},
      },
      HttpStatus.NOT_FOUND,
    );
  }
}