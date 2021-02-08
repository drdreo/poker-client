import { Config, Environment } from './configuration';

export const prodConfig = () => ({
    ENV: Environment.PROD,
    PORT: parseInt(process.env.PORT, 10) || 3000,
    WHITELIST: ['https://pokern.netlify.app'],
    TABLE: {
        END_GAME_DELAY: 1500,
        NEXT_GAME_DELAY: 5000
    }
} as Config);
