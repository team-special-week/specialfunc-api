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
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://www.google.com',
      changeOrigin: true,
      router: (req: any) => `http://localhost:${req.port}`,
    }),
  );

  await app.listen(3000);
}
bootstrap();
