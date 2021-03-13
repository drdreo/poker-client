import { Config, Environment } from './configuration';

export const testConfig = () => ({
    ENV: Environment.TEST,
    PORT: parseInt(process.env.PORT, 10) || 3000,
    WHITELIST: ['http://localhost:4200'],
    SENTRY: {
        DSN: '',
        TRACES_SAMPLE_RATE: 0,
        ENABLED: false
    },
    TABLE: {
        END_GAME_DELAY: 0,
        NEXT_GAME_DELAY: 10000, // should just prevent next game from being triggered
        AUTO_DESTROY_DELAY: 5000
    }
} as Config);
