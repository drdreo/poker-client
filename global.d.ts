declare module 'node-poker' {

	class Player {
		playerName: string;
		chips: number;
		folded: boolean;
		allIn: boolean;
		cards: [];

		GetChips(cash?: number);

		Check();

		Call();

		Fold();

		Bet(bet: number);
	}

	class Game {
		constructor(smallBlind: number, bigBlind: number, table: Table);
	}

	export class Table {
		players: Player[];

		constructor(
			smallBlind: number,
			bigBlind: number,
			minPlayers: number,
			maxPlayers: number,
			tableName: number,
			minBuyIn: number,
			maxBuyIn: number)

		AddPlayer(playerName: string, chips: number);
	}
}
