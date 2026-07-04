import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { getBetterAuthNodeHandler } from './auth/better-auth-instance';
import { TrpcHost } from './trpc/trpc.host';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3001',
    credentials: true,
  });

  const betterAuthHandler = await getBetterAuthNodeHandler();
  app
    .getHttpAdapter()
    .getInstance()
    .all(/^\/api\/auth(?:\/.*)?$/, betterAuthHandler);
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.get(TrpcHost).applyMiddleware(app);

  await app.listen(Number(process.env.PORT ?? 3002));
}

void bootstrap();
