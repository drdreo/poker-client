import { TableConfig } from './table.config';

export interface Config {
    ENV: 'prod' | 'test' | 'dev',
    PORT: number,
    WHITELIST: string[],
    TABLE: TableConfig
}

export const devConfig = () => ({
    ENV: 'dev',
    PORT: 3000,
    WHITELIST: ['http://localhost:4200'],
    TABLE: {
        END_GAME_DELAY: 1500,
        NEXT_GAME_DELAY: 5000
    }
} as Config);
