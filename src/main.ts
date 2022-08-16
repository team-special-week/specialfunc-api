import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import containerRunner from './libs/ContainerRunner';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  app.use('/api', containerRunner);

  // Proxy 연결을 통해 API 엔드포인트 mapping
  const router = (req) => {
    console.log(`redirect localhost:${req.port}`);
    return 'https://www.google.com';
  };

  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://www.naver.com',
      changeOrigin: true,
      router,
    }),
  );

  await app.listen(3000);
}
bootstrap();
