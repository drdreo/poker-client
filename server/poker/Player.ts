export interface Hand {
	rank: number;
	message: string;
}

export class Player {
	public cards: string[] = [];
	public hand: Hand;
	public folded = false;
	public allIn = false;
	disconnected: boolean = false;

	constructor(public id: string, public name: string, public chips: number) {
	}
}
