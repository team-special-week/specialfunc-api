import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { FunctionService } from '../function/function.service';
import { EFunctionStatus } from '../../common/enums/EFunctionStatus';
import {
  buildFunctionProject,
  copyFunctionProject,
  createWorkspace,
  exec,
  removeWorkspace,
} from '../../libs/RunnerHelper';

@Injectable()
export class RunnerService {
  constructor(
    @Inject(forwardRef(() => FunctionService))
    private readonly functionService: FunctionService,
  ) {}

  async build(uuid: string) {
    // 워크스페이스 생성
    await createWorkspace(uuid);

    // 함수 복사
    await copyFunctionProject(uuid);

    // 빌드 시작 전, 디비에 상태 변경
    await this.updateFunctionStatus(uuid, EFunctionStatus.BUILD_PROCESS);

    // 도커 빌드 요청
    buildFunctionProject(uuid)
      .then(() => {
        // 도커 빌드 완료, 함수 재시동
        return this.reload(uuid);
      })
      .then(async () => {
        // 재시동 성공
        await this.updateFunctionStatus(uuid, EFunctionStatus.RUNNING);
      })
      .catch(async (ex) => {
        // 빌드 또는 재시동 실패
        console.error(ex);
        await this.updateFunctionStatus(uuid, EFunctionStatus.BUILD_FAILURE);
      })
      .then(() => {
        // 워크스페이스 삭제
        return removeWorkspace(uuid);
      });
  }

  async updateFunctionStatus(uuid: string, status) {
    return this.functionService.updateFunctionStatus(uuid, status);
  }

  async reload(uuid: string) {
    try {
      // STOP, RM 은 첫 실행 시 안될 수 있음
      await exec(`docker stop ${uuid}`);
      await exec(`docker rm ${uuid}`);
    } catch (ex) {}

    await exec(`docker run -d -p 3000 --name ${uuid} ${uuid}:latest`);
  }
}
