import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const logger = app.get(Logger);
    logger.setContext('main.ts');

    const whitelist = ['http://localhost:4200', 'https://pokern.netlify.app'];
    logger.log(`Enabling CORS for ${whitelist.join(" & ")}`);
    app.enableCors({
        origin: function (origin, callback) {
            if (whitelist.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        allowedHeaders: 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Observe',
        methods: 'GET,PUT,POST,DELETE,UPDATE,OPTIONS',
        credentials: true
    });

    const port = process.env.PORT || 3000;
    logger.log(`Listening to App on port ${ port }`);
    await app.listen(port);
}

bootstrap();
