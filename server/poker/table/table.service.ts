import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Subject } from 'rxjs';
import { Config } from '../../config/configuration';
import { TableConfig } from '../../config/table.config';
import { Table } from './Table';
import { TableCommand } from './TableCommand';

const AUTO_DESTROY_TABLE_DELAY = 2000;

@Injectable()
export class TableService {

    tables: Table[] = [];

    private _tableCommands$ = new Subject<TableCommand>();
    tableCommands$ = this._tableCommands$.asObservable();

    private logger = new Logger(TableService.name);

    constructor(private configService: ConfigService<Config>) {
    }

    /**********************
     * HELPER METHODS
     **********************/

    sendCommand(command: TableCommand | any) {
        this._tableCommands$.next(command);
    }

    createTable(name: string): Table {
        const table = new Table(this.configService.get<TableConfig>('TABLE'), 10, 20, 2, 8, name);
        table.commands$ = this._tableCommands$;
        this.tables.push(table);
        return table;
    }

    playerExists(playerID: string): boolean {
        return this.tables.some((table) => {
            return table.players.some(player => player.id === playerID);
        });
    }

    getTable(roomName: string): Table {
        return this.tables.find(table => table.name === roomName);
    }

    getAllTables() {
        return this.tables.map(table => {
            return { name: table.name, started: table.hasGame() };
        });
    }

    getPlayersCount() {
        return this.tables.reduce((prev, cur) => prev + cur.players.length, 0);
    }

    playerLeft(playerID: string) {
        for (let table of this.tables) {
            const player = table.players.find(player => player.id === playerID);
            if (player) {
                player.disconnected = true;
                // if every player disconnected, remove the table after 2s
                setTimeout(() => {
                    if (table.players.every(player => player.disconnected)) {
                        this.logger.debug(`Table[${ table.name }] removed!`);
                        this.tables = this.tables.filter(t => t.name !== table.name);
                        this.sendCommand({ cmd: 'home_info' });
                    }
                }, AUTO_DESTROY_TABLE_DELAY);
                return;
            }
        }
    }

    playerReconnected(playerID: string) {
        for (let table of this.tables) {
            const player = table.players.find(player => player.id === playerID);
            if (player) {
                player.disconnected = false;
            }
        }
    }

    /**
     *
     * @returns the new players ID
     */
    createOrJoinTable(tableName: string, playerName: string): { playerID: string } {
        let table = this.getTable(tableName);

        if (!table) {
            this.logger.debug(`Player[${ playerName }] created a table!`);
            table = this.createTable(tableName);
        }

        this.logger.debug(`Player[${ playerName }] joining Table[${ tableName }]!`);

        const playerID = table.addPlayer(playerName, 1000);

        return { playerID };
    }

    startGame(tableName: string) {
        const table = this.tables.find(table => table.name === tableName);
        if (!table) {
            throw new WsException(`Can not start game on Table[${ tableName }] because it does not exist.`);
        }
        // TODO: prevent starting a new game if current is in progress
        table.newGame();
    }


    /***********************
     * Game methods
     ************************/

    check(tableName: string, playerID: string) {
        const table = this.tables.find(table => table.name === tableName);

        if (table) {
            if (table.hasGame() || table.isGameEnded()) {
                this.logger.debug(`Player[${ playerID }] checked!`);
                table.check(playerID);
            } else {
                throw new WsException(`Game has not started or has ended!`);
            }
        } else {
            throw new WsException(`Table[${ tableName }] does no longer exist!`);
        }
    }

    call(tableName: string, playerID: string) {
        const table = this.tables.find(table => table.name === tableName);

        if (table) {
            if (table.hasGame() || table.isGameEnded()) {
                this.logger.debug(`Player[${ playerID }] called!`);
                table.call(playerID);
            } else {
                throw new WsException(`Game has not started or has ended!`);
            }
        } else {
            throw new WsException(`Table[${ tableName }] does no longer exist!`);
        }
    }

    bet(tableName: string, playerID: string, coins: number) {
        const table = this.tables.find(table => table.name === tableName);

        if (table) {
            if (table.hasGame() || table.isGameEnded()) {
                this.logger.debug(`Player[${ playerID }] bet [${ coins }]!`);
                table.bet(playerID, coins);
            } else {
                throw new WsException(`Game has not started or has ended!`);
            }
        } else {
            throw new WsException(`Table[${ tableName }] does no longer exist!`);
        }
    }

    fold(tableName: string, playerID: string) {
        const table = this.tables.find(table => table.name === tableName);

        if (table) {
            if (table.hasGame() || table.isGameEnded()) {
                this.logger.debug(`Player[${ playerID }] folded!`);
                table.fold(playerID);
            } else {
                throw new WsException(`Game has not started or has ended!`);
            }
        } else {
            throw new WsException(`Table[${ tableName }] does no longer exist!`);
        }
    }
}
