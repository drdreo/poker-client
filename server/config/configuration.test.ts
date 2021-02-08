import { Config, Environment } from './configuration';

export const testConfig = () => ({
    ENV: Environment.TEST,
    PORT: parseInt(process.env.PORT, 10) || 3000,
    WHITELIST: ['http://localhost:4200'],
    TABLE: {
        END_GAME_DELAY: 0,
        NEXT_GAME_DELAY: 0
    }
} as Config);
