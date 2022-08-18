import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import {
  LIFECYCLE_INTERVAL,
  LIFECYCLE_POSITIVE_RULE,
} from '../../../common/constants/policy.constant';
import { ELifecyclePositive } from '../../../common/enums/ELifecycle';
import { CacheDBService } from '../../../libs/cache-db/cache-db.service';
import { RunnerService } from '../../runner/runner.service';
import { FunctionService } from '../function.service';
import { FunctionEntity } from '../entities/function.entity';

@Injectable()
export class LifecycleService {
  constructor(
    private readonly cacheDBService: CacheDBService,
    private readonly runnerService: RunnerService,
    @Inject(forwardRef(() => FunctionService))
    private readonly functionService: FunctionService,
  ) {}

  @Interval(LIFECYCLE_INTERVAL)
  async coldStartDetector() {
    const runningKeys = await this.cacheDBService.getKeys();

    for (const key of runningKeys) {
      let func: FunctionEntity = null;
      {
        const funcUUID = key.split(':')[1];
        if (!funcUUID || funcUUID.length !== 32) {
          await this.terminateLifecycle(funcUUID);
          continue;
        }

        const functions = await this.functionService.getAllFunctions({
          uuid: funcUUID,
        });
        if (functions.length === 1) {
          func = functions[0];
        } else {
          await this.terminateLifecycle(funcUUID);
          continue;
        }
      }

      const remainTime = await this.getRemainLifetime(func.uuid);

      if (remainTime - 1 <= 0) {
        // COLD_START 로 변경 요청
        this.runnerService.cold(func.uuid);

        // lifecycle 에서 배제
        await this.terminateLifecycle(func.uuid);
      } else {
        // 차감 후 다음으로
        await this.setRemainLifetime(remainTime - 1, func.uuid);
      }
    }
  }

  enrollLifecycle(uuid: string, defaultLifetime: number) {
    return this.setRemainLifetime(defaultLifetime, uuid);
  }

  terminateLifecycle(uuid: string) {
    return this.cacheDBService.del(LifecycleService.REMAIN_LIFETIME_KEY(uuid));
  }

  async increaseLifetime(positiveReason: ELifecyclePositive, funcUUID: string) {
    let remainTime = await this.getRemainLifetime(funcUUID);

    // positive 의 이유를 찾아 increase 한다.
    remainTime += LIFECYCLE_POSITIVE_RULE[positiveReason];

    // set 한다.
    await this.setRemainLifetime(remainTime, funcUUID);
  }

  async getRemainLifetime(funcUUID: string): Promise<number> {
    return this.cacheDBService.get<number>(
      LifecycleService.REMAIN_LIFETIME_KEY(funcUUID),
      0,
    );
  }

  async setRemainLifetime(newRemainTime: number, funcUUID: string) {
    return this.cacheDBService.set<number>(
      LifecycleService.REMAIN_LIFETIME_KEY(funcUUID),
      newRemainTime,
    );
  }

  static REMAIN_LIFETIME_KEY = (uuid: string) => `remain-lifetime:${uuid}`;
}
