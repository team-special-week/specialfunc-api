import { ESPFuncStatusCode } from 'src/common/enums/ESPFuncStatusCode';
import { HttpException, HttpStatus } from '@nestjs/common';

export class ExceedFunctionCountException extends HttpException {
  constructor() {
    super(
      {
        status: ESPFuncStatusCode.EXCEED_FUNCTION_COUNT,
        message: 'Exceed function count',
        data: {},
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class EndpointOrMethodExistsException extends HttpException {
  constructor() {
    super(
      {
        status: ESPFuncStatusCode.ENDPOINT_OR_METHOD_EXIST,
        message: 'Endpoint or method exists',
        data: {},
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class EndpointNotValidException extends HttpException {
  constructor() {
    super(
      {
        status: ESPFuncStatusCode.ENDPOINT_NOT_VALID,
        message: 'Endpoint is not valid.',
        data: {},
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class FunctionNotFoundException extends HttpException {
  constructor() {
    super(
      {
        status: ESPFuncStatusCode.FUNCTION_NOT_FOUND,
        message: 'Function not found',
        data: {},
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
