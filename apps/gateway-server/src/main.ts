import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('EnterpriseGatewayBootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Enterprise AI Gateway')
    .setDescription(
      'NestJS API gateway that authenticates clients and proxies requests to the Python agent-core service.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste a JWT access token',
      },
      'JWT',
    )
    .addTag('AI Gateway', 'Prompt dispatch and agent-core proxy endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(
    `Gateway Server listening at http://localhost:${port}`,
  );
  logger.log(
    `Swagger docs available at http://localhost:${port}/api/docs`,
  );
}

bootstrap();
