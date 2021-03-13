import { TableConfig } from './table.config';

export enum Environment {
    DEV = 'dev',
    TEST = 'test',
    PROD = 'prod'
}

export interface Config {
    ENV: Environment,
    PORT: number,
    WHITELIST: string[],
    SENTRY: SentryConfig,
    TABLE: TableConfig
}

export interface SentryConfig {
    DSN: string;
    TRACES_SAMPLE_RATE: number;
    ENABLED: boolean;
}

export const devConfig = () => ({
    ENV: Environment.DEV,
    PORT: 3000,
    WHITELIST: ['http://localhost:4200'],
    SENTRY: {
        DSN: 'https://84b1e4f998e14d0182b75bef0d2f48ff@o528779.ingest.sentry.io/5646377',
        TRACES_SAMPLE_RATE: 1.0,
        ENABLED: false
    },
    TABLE: {
        END_GAME_DELAY: 5000,
        NEXT_GAME_DELAY: 5000,
        AUTO_DESTROY_DELAY: 5000
    }
} as Config);
