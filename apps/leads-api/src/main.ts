/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { AppModule } from './app/app.module';

async function bootstrap() {
  // Load environment variables from .env file in the workspace root
  dotenv.config();

  Logger.log('🚀 Starting SAM Leads API (Development Mode)...', 'Bootstrap');
  Logger.log('🔧 Using Integrated In-Memory MongoDB', 'Bootstrap');

  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableCors(); // Enable CORS for all origins
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 API is running on: http://localhost:${port}/${globalPrefix}`,
    'Bootstrap'
  );
}

bootstrap();
