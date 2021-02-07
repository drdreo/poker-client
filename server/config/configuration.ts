import { TableConfig } from './table.config';

export interface Config {
    PORT: number,
    WHITELIST: string[],
    TABLE: TableConfig
}

export const devConfig = () => ({
    PORT: 3000,
    WHITELIST: ['http://localhost:4200'],
    TABLE: {
        END_GAME_DELAY: 1500,
        NEXT_GAME_DELAY: 5000
    }
} as Config);
