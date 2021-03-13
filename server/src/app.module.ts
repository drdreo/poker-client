import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SentryModule } from '@ntegral/nestjs-sentry';
import { LogLevel } from '@sentry/types';

import { devConfig, Environment, Config, SentryConfig } from './config/configuration';
import { prodConfig } from './config/configuration.prod';
import { testConfig } from './config/configuration.test';
import { PokerModule } from './poker/poker.module';

@Module({
    imports: [
        SentryModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (cfg: ConfigService<Config>) => ({
                dsn: cfg.get<SentryConfig>('SENTRY').DSN,
                environment: cfg.get<Environment>('ENV') === Environment.PROD ? 'production' : 'dev',
                enabled: cfg.get<Environment>('ENV') === Environment.PROD,
                tracesSampleRate: cfg.get('SENTRY').TRACES_SAMPLE_RATE,
                logLevel: LogLevel.Debug //based on sentry.io loglevel //
            }),
            inject: [ConfigService]
        }),
        ConfigModule.forRoot({
            load: [process.env.NODE_ENV === Environment.PROD ? prodConfig : process.env.NODE_ENV === Environment.TEST ? testConfig : devConfig]
        }),
        PokerModule
    ]
})
export class AppModule {

}
