import { CacheModule, Global, Module } from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { CacheDBService } from './cache-db.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const cacheModule = CacheModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    store: redisStore,
    host: configService.get('REDIS_HOST'),
    port: configService.get('REDIS_PORT'),
    ttl: 0,
    auth_pass: configService.get('REDIS_PASS'),
  }),
  inject: [ConfigService],
});

@Global()
@Module({
  imports: [cacheModule],
  providers: [CacheDBService],
  exports: [CacheDBService],
})
export class CacheDBModule {}
