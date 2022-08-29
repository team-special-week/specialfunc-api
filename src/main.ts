import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import containerRunner from './libs/ContainerRunner';
import { RunnerService } from './components/runner/runner.service';
import { LifecycleService } from './components/function/apps/lifecycle.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  const runnerService = app.get<RunnerService>(RunnerService);
  const lifecycleService = app.get<LifecycleService>(LifecycleService);

  app.use('/api', containerRunner(runnerService, lifecycleService));

  // Proxy 연결을 통해 API 엔드포인트 mapping
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://www.google.com',
      changeOrigin: true,
      router: (req: any) => `http://localhost:${req.port}`,
    }),
  );

  await app.listen(53125);
}
bootstrap();
