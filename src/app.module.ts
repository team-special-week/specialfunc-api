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
    AuthModule,
    UserModule,
    ApplicationModule,
    FunctionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
