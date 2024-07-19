import {
  BaseExceptionFilter,
  HttpAdapterHost,
  NestFactory,
} from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import './sentry';
import * as Sentry from '@sentry/nestjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { httpAdapter } = app.get(HttpAdapterHost);

  Sentry.setupNestErrorHandler(app, new BaseExceptionFilter(httpAdapter));

  app.enableCors({
    allowedHeaders: '*',
    origin: '*', // TODO: Change this to the correct ones
  });

  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'Api-Version',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();
