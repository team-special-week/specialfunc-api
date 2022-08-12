export enum ESPFuncStatusCode {
  EXCEED_APPLICATION_COUNT = 'A100',
  ENDPOINT_ALREADY_EXIST = 'A101',
  APP_NOT_FOUND = 'A102',
  DELETED_APPLICATION = 'A103',

  UNREGISTERED_ACCOUNT = 'U100',
  BLOCKED_ACCOUNT = 'U101',
  USER_NOT_FOUND_EXCEPTION = 'U102',

  EXCEED_FUNCTION_COUNT = 'F100',
  ENDPOINT_OR_METHOD_EXIST = 'F101',
  ENDPOINT_NOT_VALID = 'F102',
  FUNCTION_NOT_FOUND = 'F103',
  BUILD_ALREADY_RUNNING = 'F104',
}
