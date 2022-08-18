import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReleaseHistoryEntity } from '../entities/release-history.entity';
import IReleaseHistory from '../interfaces/IReleaseHistory';
import { FunctionEntity } from '../entities/function.entity';
import { EBuildStatus } from '../../../common/enums/EBuildStatus';
import { ReleaseHistoryNotFound } from '../exceptions/function.exceptions';

@Injectable()
export class ReleaseHistoryService {
  constructor(
    @InjectRepository(ReleaseHistoryEntity)
    private readonly releaseHistoryEntity: Repository<ReleaseHistoryEntity>,
    @InjectRepository(FunctionEntity)
    private readonly functionEntity: Repository<FunctionEntity>,
  ) {}

  async createReleaseHistory(
    funcUUID: string,
    zipFileSize: number,
  ): Promise<IReleaseHistory> {
    const func = await this.getFunction(funcUUID);

    // 새 함수의 릴리즈 히스토리를 생성
    let savedResult: IReleaseHistory;
    {
      const releaseHistoryEntity = new ReleaseHistoryEntity();
      releaseHistoryEntity.func = func;
      releaseHistoryEntity.zipFileSize = zipFileSize;
      releaseHistoryEntity.buildStatus = EBuildStatus.BUILD_PROCESS;

      const result = await this.releaseHistoryEntity.save(releaseHistoryEntity);
      savedResult = result.metadata;
    }

    return savedResult;
  }

  async updateLastReleaseHistoryStatus(
    funcUUID: string,
    newState: EBuildStatus,
  ): Promise<void> {
    const lastReleaseHistory = await this.findLastReleaseHistory(funcUUID);

    if (lastReleaseHistory === null) {
      throw new ReleaseHistoryNotFound();
    }

    await this.releaseHistoryEntity.update(lastReleaseHistory._id, {
      buildStatus: newState,
    });
  }

  async updateLastReleaseHistoryPort(
    funcUUID: string,
    portNumber: number,
  ): Promise<void> {
    const lastReleaseHistory = await this.findLastReleaseHistory(funcUUID);

    if (lastReleaseHistory === null) {
      throw new ReleaseHistoryNotFound();
    }

    await this.releaseHistoryEntity.update(lastReleaseHistory._id, {
      port: portNumber,
    });
  }

  async findLastReleaseHistory(
    funcUUID: string,
  ): Promise<IReleaseHistory | null> {
    const func = await this.getFunction(funcUUID);

    if (func.releaseHistory.length > 0) {
      return func.releaseHistory[func.releaseHistory.length - 1].metadata;
    } else {
      return null;
    }
  }

  async deprecateReleaseHistory(funcUUID: string) {
    const func = await this.getFunction(funcUUID);
    const releaseHistory = await this.releaseHistoryEntity.find({
      where: {
        func: { _id: func._id },
      },
    });

    for (const rh of releaseHistory) {
      if (
        rh.buildStatus === EBuildStatus.WARM_START ||
        rh.buildStatus === EBuildStatus.COLD_START
      ) {
        await this.releaseHistoryEntity.update(rh._id, {
          buildStatus: EBuildStatus.DEPRECATED,
        });
      }
    }
  }

  private async getFunction(funcUUID: string) {
    return this.functionEntity.findOne({
      where: {
        uuid: funcUUID,
      },
      relations: ['releaseHistory'],
    });
  }
}
