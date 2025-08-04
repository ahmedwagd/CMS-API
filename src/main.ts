import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    // origin: [
    //   `${process.env.FRONTEND_URL}`, // Allow requests from your frontend URL
    //   'http://localhost:3000', // Allow requests from localhost:3000
    // ],
    methods: ['*'],
    credentials: true,
    origin: true,
    // allowedHeaders: ['Authorization', 'Content-Type'],
    allowedHeaders: ['Content-Type'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Set the global route prefix
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 3030);
}
bootstrap();
