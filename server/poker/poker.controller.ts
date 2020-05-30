import { Controller, Get, HttpException, HttpStatus, Param } from '@nestjs/common';
import { TableService } from './table/table.service';

export interface PokerTable {
	name: string;
	started: boolean;
}

interface HomeInfo {
	tables: PokerTable[];
	players: number;
}


@Controller('api/poker')
export class PokerController {
	constructor(private readonly tableService: TableService) {}

	@Get('/home')
	getHomeInfo(): HomeInfo {
		return {tables: this.tableService.getAllTables(), players: this.tableService.getPlayersCount()};
	}

	@Get('/table/:name')
	getTable(@Param("name") name) {
		const table = this.tableService.getTable(name);

		console.log(table);
		if (table) {
			return {name: table.name, players: table.getPlayersPreview()};
		}

		throw new HttpException('Table does not exist!', HttpStatus.NOT_FOUND);
	}

}
