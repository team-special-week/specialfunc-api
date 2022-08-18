import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as winston from 'winston';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import { AuthModule } from './components/auth/auth.module';
import { UserModule } from './components/user/user.module';
import { ApplicationModule } from './components/application/application.module';
import { FunctionModule } from './components/function/function.module';
import { RunnerModule } from './components/runner/runner.module';
import { MulterModule } from '@nestjs/platform-express';
import { ReleaseHistoryModule } from './components/function/apps/release-history.module';
import { LifecycleModule } from './components/function/apps/lifecycle.module';
import * as path from 'path';
import { CacheDBModule } from './libs/cache-db/cache-db.module';
import { FileModule } from './components/file/file.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('MYSQL_DATABASE_HOST'),
        port: configService.get('MYSQL_DATABASE_PORT'),
        username: configService.get('MYSQL_DATABASE_USER'),
        password: configService.get('MYSQL_DATABASE_PASS'),
        database: configService.get('MYSQL_DATABASE_NAME'),
        synchronize: configService.get('SYNCHRONIZE') === 'true',
        entities: [__dirname + '/**/entities/*.entity{.ts,.js}'],
        logging: true,
      }),
      inject: [ConfigService],
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          level: process.env.NODE_ENV === 'production' ? 'info' : 'silly',
          format: winston.format.combine(
            winston.format.timestamp(),
            nestWinstonModuleUtilities.format.nestLike('SpecialFunc', {
              prettyPrint: true,
            }),
          ),
        }),
      ],
    }),
    MulterModule.register({
      dest: `${path.join(__dirname, 'tmp')}`,
    }),
    AuthModule,
    UserModule,
    ApplicationModule,
    FunctionModule,
    RunnerModule,
    ReleaseHistoryModule,
    LifecycleModule,
    CacheDBModule,
    FileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
