export enum EFunctionStatus {
  CREATED = 'CREATED', // 함수는 만들었으나, 빌드되지는 않은 상태
  BUILD_PROCESS = 'BUILD_PROCESS', // 빌드를 진행하고 있는 상태
  BUILD_FAILURE = 'BUILD_FAILURE', // 빌드에 실패하여 배포가 불가능한 상태
  READY = 'READY', // 빌드에 성공했지만, docker 에서 실행되지는 않은 상태
  RUNNING = 'RUNNING', // docker 에서 실행중이며 요청을 받을 수 있는 상태
}