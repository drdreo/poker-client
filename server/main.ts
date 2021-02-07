import { Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';


const logLevels: LogLevel[] = process.env.production ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug', 'verbose'];

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: logLevels
    });
    const configService = app.get(ConfigService);
    const logger = app.get(Logger);
    logger.setContext('main.ts');

    const whitelist = configService.get('WHITELIST');
    logger.log(`Enabling CORS for ${ whitelist.join(' & ') }`);
    app.enableCors({
        origin: function (origin, callback) {
            if (whitelist.indexOf(origin) !== -1 || !origin) {
                callback(null, true);
            } else {
                callback(new Error(`Origin[${ origin }] Not allowed by CORS`));
            }
        },
        allowedHeaders: 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe',
        methods: 'GET,PUT,POST,DELETE,UPDATE,OPTIONS',
        credentials: true
    });

    const port = configService.get('PORT');
    logger.log(`Listening to App on port ${ port }`);
    await app.listen(port);
}

bootstrap();
