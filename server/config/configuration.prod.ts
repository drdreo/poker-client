import { Config, Environment } from './configuration';

export const prodConfig = () => ({
    ENV: Environment.PROD,
    PORT: parseInt(process.env.PORT, 10) || 3000,
    WHITELIST: ['https://pokern.netlify.app'],
    SENTRY: {
        DSN: 'https://84b1e4f998e14d0182b75bef0d2f48ff@o528779.ingest.sentry.io/5646377',
        TRACES_SAMPLE_RATE: 0.2,
        ENABLED: true
    },
    TABLE: {
        END_GAME_DELAY: 5000,
        NEXT_GAME_DELAY: 5000,
        AUTO_DESTROY_DELAY: 5000
    }
} as Config);
