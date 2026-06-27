import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { TrpcHost } from './trpc/trpc.host';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3001',
    credentials: true,
  });

  app.get(TrpcHost).applyMiddleware(app);

  await app.listen(Number(process.env.PORT ?? 3002));
}

void bootstrap();
