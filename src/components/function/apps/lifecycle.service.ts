import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { LIFECYCLE_INTERVAL } from '../../../common/constants/policy.constant';

@Injectable()
export class LifecycleService {
  @Interval(LIFECYCLE_INTERVAL)
  async coldStartDetector() {

  }
}
