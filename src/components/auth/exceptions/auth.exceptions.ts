import { ESPFuncStatusCode } from '../../../common/enums/ESPFuncStatusCode';
import { HttpException, HttpStatus } from '@nestjs/common';

export class UnregisteredUserException extends HttpException {
  constructor(deletedAt: Date) {
    super(
      {
        status: ESPFuncStatusCode.UNREGISTERED_ACCOUNT,
        message: 'Unregistered account.',
        data: {
          deletedAt,
        },
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class BlockedUserException extends HttpException {
  constructor(blockExpiresAt: Date) {
    super(
      {
        status: ESPFuncStatusCode.BLOCKED_ACCOUNT,
        message: 'Blocked account.',
        data: {
          blockExpiresAt,
        },
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class UserNotFoundException extends HttpException {
  constructor() {
    super(
      {
        status: ESPFuncStatusCode.USER_NOT_FOUND_EXCEPTION,
        message: 'User not found.',
        data: {},
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
