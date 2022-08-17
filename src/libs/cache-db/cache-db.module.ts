import { CacheModule, Global, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { CacheDBService } from './cache-db.service';
// import {
//   REDIS_HOST,
//   REDIS_PORT,
//   REDIS_TTL,
// } from '../../common/constants/policy.constant';

// export const cacheModule = CacheModule.registerAsync({
//   useFactory: async () => ({
//     store: redisStore,
//     host: REDIS_HOST,
//     port: `${REDIS_PORT}`,
//     ttl: REDIS_TTL,
//     auth_pass: '',
//   }),
// });

@Global()
@Module({
  // imports: [cacheModule],
  providers: [CacheDBService],
  exports: [CacheDBService],
})
export class CacheDBModule {}
