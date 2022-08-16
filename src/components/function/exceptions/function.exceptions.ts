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

export class BuildAlreadyRunningException extends HttpException {
  constructor() {
    super(
      {
        status: ESPFuncStatusCode.BUILD_ALREADY_RUNNING,
        message: 'Build already running.',
        data: {},
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class NotZipFileException extends HttpException {
  constructor() {
    super(
      {
        status: ESPFuncStatusCode.NOT_ZIP_FILE,
        message: 'Not a zip file.',
        data: {},
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ReleaseHistoryNotFound extends HttpException {
  constructor() {
    super(
      {
        status: ESPFuncStatusCode.RELEASE_HISTORY_NOT_FOUND,
        message: 'Release history not found',
        data: {},
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class PortAssignFailureException extends HttpException {
  constructor() {
    super(
      {
        status: ESPFuncStatusCode.PORT_ASSIGN_FAILURE,
        message: 'Port number assign failure.',
        data: {},
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}


