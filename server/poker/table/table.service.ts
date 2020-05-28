import { Injectable, Logger } from '@nestjs/common';
import { Table } from './Table';
import { Subject } from 'rxjs';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class TableService {

	tables: Table[] = [];

	private _tableCommands$ = new Subject();
	tableCommands$ = this._tableCommands$.asObservable();

	constructor(private logger: Logger) {
		this.logger.setContext('TableService');
	}

	/**********************
	 * HELPER METHODS
	 **********************/

	createTable(name: string): Table {
		this.logger.debug(`Table[${name}] created!`);
		const table = new Table(50, 100, 2, 2, name, 1000, 1000);
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

	playerLeft(playerID: string) {
		for (let table of this.tables) {
			const player = table.players.find(player => player.id === playerID);
			if (player) {
				player.disconnected = true;
				// if every player disconnected, remove the table
				if (table.players.every(player => player.disconnected)) {
					this.logger.debug(`Table[${table.name}] removed!`);
					this.tables = this.tables.filter(t => t.name !== table.name);
				}
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
			this.logger.debug(`Player[${playerName}] created a table!`);
			table = this.createTable(tableName);
		}

		this.logger.debug(`Player[${playerName}] joining Table[${tableName}]!`);

		const playerID = table.addPlayer(playerName, 1000);
		if (!playerID) {
			throw Error('This shouldnt ever happen!');
		}

		return {playerID};
	}

	startGame(tableName: string) {
		const table = this.tables.find(table => table.name === tableName);
		table.startGame();
		this._tableCommands$.next({cmd: 'game_started', data: table.players});
	}


	/***********************
	 * Game methods
	 ************************/

	check(tableName: string, playerID: string) {
		const table = this.tables.find(table => table.name === tableName);

		if (table) {
			if (table.hasGame()) {
				this.logger.debug(`Player[${playerID}] checked!`);
				table.check(playerID);
			} else {
				throw new WsException(`Can't act before the game has started!`);
			}
		} else {
			throw new WsException(`Table[${tableName}] does no longer exist!`);
		}
	}

	call(tableName: string, playerID: string) {
		const table = this.tables.find(table => table.name === tableName);

		if (table) {
			if (table.hasGame()) {
				this.logger.debug(`Player[${playerID}] called!`);
				table.call(playerID);
			} else {
				throw new WsException(`Can't act before the game has started!`);
			}
		} else {
			throw new WsException(`Table[${tableName}] does no longer exist!`);
		}
	}

	bet(tableName: string, playerID: string, coins: number) {
		const table = this.tables.find(table => table.name === tableName);

		if (table) {
			if (table.hasGame()) {
				this.logger.debug(`Player[${playerID}] bet [${coins}]!`);
				table.bet(playerID, coins);
			} else {
				throw new WsException(`Can't act before the game has started!`);
			}
		} else {
			throw new WsException(`Table[${tableName}] does no longer exist!`);
		}
	}

	fold(tableName: string, playerID: string) {
		const table = this.tables.find(table => table.name === tableName);

		if (table) {
			if (table.hasGame()) {
				this.logger.debug(`Player[${playerID}] folded!`);
				table.fold(playerID);
			} else {
				throw new WsException(`Can't act before the game has started!`);
			}
		} else {
			throw new WsException(`Table[${tableName}] does no longer exist!`);
		}
	}


}
