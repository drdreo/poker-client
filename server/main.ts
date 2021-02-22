import { Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

import { AppModule } from './app.module';
import { Config, Environment } from './config/configuration';

const logLevels: LogLevel[] = process.env.NODE_ENV === 'prod' ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug', 'verbose'];

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


    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span/breadcrumb is attached to its own Hub instance
    app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    app.use(Sentry.Handlers.tracingHandler());
    // the rest of your app
    app.use(Sentry.Handlers.errorHandler());

    const httpAdapter = app.getHttpAdapter();
    const expressApp =  httpAdapter.getInstance();

    Sentry.init({
        dsn: 'https://84b1e4f998e14d0182b75bef0d2f48ff@o528779.ingest.sentry.io/5646377',
        environment: configService.get<Environment>('ENV') === Environment.PROD ? 'production' : 'dev',
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Tracing.Integrations.Express({
                // @ts-ignore
                expressApp
            })
        ],
        tracesSampleRate: configService.get<Environment>('ENV') === Environment.PROD ? 0.2 : 1.0
    });


    const port = configService.get<number>('PORT');
    logger.log(`Listening to App on port ${ port }`);
    await app.listen(port);
}

bootstrap();
