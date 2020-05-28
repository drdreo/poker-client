import { Logger } from '@nestjs/common';

export class Game {
	public pot: number = 0;
	public round: Round;
	public deck: string[] = [];
	public board: string[] = [];

	constructor(private smallBlind: number, private bigBlind: number) {
		Logger.debug('Game started!');
		this.newRound('Deal'); //Start the first round
		this.fillDeck();
	}

	newRound(name: string) {
		this.round = new Round(name);
	}

	fillDeck() {
		this.deck.push('AS');
		this.deck.push('KS');
		this.deck.push('QS');
		this.deck.push('JS');
		this.deck.push('TS');
		this.deck.push('9S');
		this.deck.push('8S');
		this.deck.push('7S');
		this.deck.push('6S');
		this.deck.push('5S');
		this.deck.push('4S');
		this.deck.push('3S');
		this.deck.push('2S');
		this.deck.push('AH');
		this.deck.push('KH');
		this.deck.push('QH');
		this.deck.push('JH');
		this.deck.push('TH');
		this.deck.push('9H');
		this.deck.push('8H');
		this.deck.push('7H');
		this.deck.push('6H');
		this.deck.push('5H');
		this.deck.push('4H');
		this.deck.push('3H');
		this.deck.push('2H');
		this.deck.push('AD');
		this.deck.push('KD');
		this.deck.push('QD');
		this.deck.push('JD');
		this.deck.push('TD');
		this.deck.push('9D');
		this.deck.push('8D');
		this.deck.push('7D');
		this.deck.push('6D');
		this.deck.push('5D');
		this.deck.push('4D');
		this.deck.push('3D');
		this.deck.push('2D');
		this.deck.push('AC');
		this.deck.push('KC');
		this.deck.push('QC');
		this.deck.push('JC');
		this.deck.push('TC');
		this.deck.push('9C');
		this.deck.push('8C');
		this.deck.push('7C');
		this.deck.push('6C');
		this.deck.push('5C');
		this.deck.push('4C');
		this.deck.push('3C');
		this.deck.push('2C');

		//Shuffle the deck array with Fisher-Yates
		for (let i = 0; i < this.deck.length; i++) {
			let j = Math.floor(Math.random() * (i + 1));
			let tempi = this.deck[i];
			let tempj = this.deck[j];
			this.deck[i] = tempj;
			this.deck[j] = tempi;
		}
	}
}

//name: Deal,Flop,Turn,River,Showdown
class Round {
	bets = [];
	betName = 'bet'; //bet,raise,re-raise,cap
	constructor(public name: string) { }
}
