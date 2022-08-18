import { Injectable } from '@nestjs/common';
import {
  buildFunctionProject,
  copyFunctionProject,
  createWorkspace,
  exec,
  removeWorkspace,
} from '../../libs/RunnerHelper';
import { ReleaseHistoryService } from '../function/apps/release-history.service';
import { EBuildStatus } from '../../common/enums/EBuildStatus';
import { PortAssignFailureException } from '../function/exceptions/function.exceptions';

@Injectable()
export class RunnerService {
  constructor(private readonly releaseHistoryService: ReleaseHistoryService) {}

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

        // 포트 넘버 할당
        return this.assignPortToFunction(uuid);
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

  cold(uuid: string) {
    this.updateFunctionStatus(uuid, EBuildStatus.COLD_START)
      .then(() => {
        // cold start 로 변환 성공, 컨테이너 중지
        return this.pause(uuid);
      })
      .catch((ex) => {
        console.error(ex);
      });
  }

  async warm(uuid: string): Promise<number | null> {
    return this.start(uuid)
      .then(() => {
        // 컨테이너 실행 성공, WARM_START 로 상태 변경
        return this.updateFunctionStatus(uuid, EBuildStatus.WARM_START);
      })
      .then(() => {
        return this.assignPortToFunction(uuid);
      })
      .catch((ex) => {
        console.error(ex);
        return null;
      });
  }

  async updateFunctionStatus(uuid: string, status: EBuildStatus) {
    return this.releaseHistoryService.updateLastReleaseHistoryStatus(
      uuid,
      status,
    );
  }

  async assignPortToFunction(uuid: string): Promise<number> {
    let contInfo = await exec(`docker inspect ${uuid}`);

    if (!contInfo) {
      // Docker 컨테이너가 제대로 실행되지 못한 경우
      throw new PortAssignFailureException();
    }

    let portNumber = -1;
    try {
      contInfo = JSON.parse(contInfo)[0];
      portNumber = Number(
        contInfo['NetworkSettings']['Ports']['3000/tcp'][0]['HostPort'],
      );
    } catch (ex) {
      throw new PortAssignFailureException();
    }

    await this.releaseHistoryService.updateLastReleaseHistoryPort(
      uuid,
      portNumber,
    );

    return portNumber;
  }

  async reload(uuid: string) {
    await this.stop(uuid);
    await exec(`docker run -d -p 3000 --name ${uuid} ${uuid}:latest`);
  }

  async pause(uuid: string) {
    await exec(`docker stop ${uuid}`);
  }

  async start(uuid: string) {
    await exec(`docker start ${uuid}`);
  }

  async stop(uuid: string) {
    try {
      // STOP, RM 은 첫 실행 시 안될 수 있음
      await this.pause(uuid);
      await exec(`docker rm ${uuid}`);
    } catch (ex) {}
  }
}
