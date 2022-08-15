import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { FunctionService } from '../function/function.service';
import {
  buildFunctionProject,
  copyFunctionProject,
  createWorkspace,
  exec,
  removeWorkspace,
} from '../../libs/RunnerHelper';
import { ReleaseHistoryService } from '../function/apps/release-history.service';
import { EBuildStatus } from '../../common/enums/EBuildStatus';

@Injectable()
export class RunnerService {
  constructor(
    @Inject(forwardRef(() => FunctionService))
    private readonly functionService: FunctionService,
    private readonly releaseHistoryService: ReleaseHistoryService,
  ) {}

  async build(uuid: string) {
    // 워크스페이스 생성
    await createWorkspace(uuid);

    // 함수 복사
    await copyFunctionProject(uuid);

    // 도커 빌드 요청
    buildFunctionProject(uuid)
      .then(async () => {
        // 도커 이미지를 빌드했으므로, 기존 함수 DEPRECATED
        await this.releaseHistoryService.deprecateReleaseHistory(uuid);

        // 새 함수 리로드
        return this.reload(uuid);
      })
      .then(async () => {
        // 재시동 성공
        await this.updateFunctionStatus(uuid, EBuildStatus.WARM_START);
      })
      .catch(async (ex) => {
        // 빌드 또는 재시동 실패
        console.error(ex);
        await this.updateFunctionStatus(uuid, EBuildStatus.BUILD_FAILURE);
      })
      .then(() => {
        // 워크스페이스 삭제
        return removeWorkspace(uuid);
      });
  }

  async updateFunctionStatus(uuid: string, status: EBuildStatus) {
    return this.releaseHistoryService.updateLastReleaseHistoryStatus(
      uuid,
      status,
    );
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
