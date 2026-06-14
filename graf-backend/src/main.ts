import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import compression from 'compression';
import * as dotenv from 'dotenv';
import { json, urlencoded } from 'express';

function validateEnvironment() {
  const requiredEnvVars = [];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    console.warn(
      'Missing optional environment variables:',
      missingVars.join(', '),
    );
  }

  console.log('Environment validation completed');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('PORT:', process.env.PORT || 3004);
}

async function bootstrap() {
  try {
    dotenv.config();
    validateEnvironment();
    const app = await NestFactory.create(AppModule, {
      bodyParser: false, // Desactivar bodyParser automático para configurarlo manualmente
      cors: true,
    });
    // Aumentar límite de payload para cargas grandes (Excel, Imágenes)
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ extended: true, limit: '50mb' }));

    app.use(compression());
    const config = new DocumentBuilder()
      .setTitle('Total Pedidos API')
      .setDescription(
        'Documentación de la API para el e-commerce Total Pedidos',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    app
      .getHttpAdapter()
      .getInstance()
      .get('/health', (req, res) => {
        res.status(200).send('OK');
      });
    const port = process.env.PORT || 3004;
    await app.listen(port, '0.0.0.0', () => {});
    console.info(`Application is running on: http://localhost:${port}/api`);
  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap().catch((error) => {
  console.error('Bootstrap failed:', error);
  process.exit(1);
});
