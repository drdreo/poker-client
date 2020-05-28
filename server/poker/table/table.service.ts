import { Injectable, Logger } from '@nestjs/common';
import { Table } from '../table';

@Injectable()
export class TableService {

	tables: Table[] = [];

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

	/**
	 *
	 * @returns the new players ID
	 */
	createOrJoinTable(tableName: string, playerName: string): string {
		let table = this.getTable(tableName);

		if (!table) {
			this.logger.debug(`Player[${playerName}] created a table!`);
			table = this.createTable(tableName);
		}

		this.logger.debug(`Player[${playerName}] joined Table[${playerName}]!`);
		return table.addPlayer(playerName, 1000);
	}

	/***********************
	 * Game methods
	 ************************/

	check(playerID: string) {
		this.logger.debug(`Player[${playerID}] checked!`);

		// Todo: find table
		this.tables[0].check(playerID);
	}

	call(playerID: string) {
		this.logger.debug(`Player[${playerID}] called!`);

		// Todo: find table
		this.tables[0].call(playerID);
	}

	bet(playerID: string, coins: number) {
		this.logger.debug(`Player[${playerID}] bet [${coins}]!`);

		// Todo: find table
		this.tables[0].call(playerID);
	}

	fold(playerID: string) {
		this.logger.debug(`Player[${playerID}] folded!`);

		// Todo: find table
		this.tables[0].fold(playerID);
	}


}
