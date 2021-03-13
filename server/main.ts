import { Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';


import { AppModule } from './src/app.module';
import { Config, Environment } from './src/config/configuration';

const logLevels: LogLevel[] = process.env.NODE_ENV === 'prod' ? ['error', 'warn', 'log'] : ['log', 'error', 'warn', 'debug', 'verbose'];

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: logLevels
    });
    const configService: ConfigService<Config> = app.get(ConfigService);
    const logger = app.get(Logger);
    logger.setContext('main.ts');
    logger.log(`Running app in {${ configService.get<Environment>('ENV') }} environment!`);

    const whitelist = configService.get<string[]>('WHITELIST');
    logger.log(`Enabling CORS for ${ whitelist.join(' & ') }`);

    app.enableCors({
        origin: function (origin, callback) {
            if (whitelist.indexOf(origin) !== -1 || !origin) {
                callback(null, true);
            } else {
                callback(new Error(`Origin[${ origin }] Not allowed by CORS`));
            }
        },
        allowedHeaders: 'X-Requested-With,X-HTTP-Method-Override,Content-Type,OPTIONS,Accept,Observe,sentry-trace',
        methods: 'GET,PUT,POST,DELETE,UPDATE,OPTIONS',
        credentials: true
    });

    const port = configService.get<number>('PORT');
    logger.log(`App listening on port {${ port }}`);
    await app.listen(port);
}

bootstrap();
