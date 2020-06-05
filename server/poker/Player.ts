export interface Hand {
	rank: number;
	message: string;
}

export type  PlayerPreview = Omit<Player, 'cards' | 'hand' | 'reset'>;

export class Player {
	public cards: string[] = [];
	public hand: Hand;
	public folded = false;
	public allIn = false;
	disconnected: boolean = false;

	constructor(public id: string, public name: string, public color: string, public chips: number) {
	}

	reset() {
		this.folded = false;
		this.allIn = false;
		this.hand = null;
		this.cards = [];
	}
}
