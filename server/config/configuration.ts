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
    TABLE: TableConfig
}

export const devConfig = () => ({
    ENV: Environment.DEV,
    PORT: 3000,
    WHITELIST: ['http://localhost:4200'],
    TABLE: {
        END_GAME_DELAY: 1500,
        NEXT_GAME_DELAY: 5000
    }
} as Config);
