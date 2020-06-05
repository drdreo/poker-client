import { Component, Input, OnInit } from '@angular/core';
import { Card } from '../card/card.component';

export interface Player {
	id: string;
	name: string;
	chips: number;
	bet: number;
	color: string;
	cards?: Card[];
	allIn: boolean;
	folded:boolean;
	disconnected:boolean;
}

@Component({
	selector: 'app-player',
	templateUrl: './player.component.html',
	styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements OnInit {

	@Input() player: Player;
	@Input() playing: boolean;
	@Input() index;

	constructor() { }

	ngOnInit() {
	}

	getPlayersBank(){
		if(this.player.bet){
			return this.player.chips - this.player.bet;
		}
		return this.player.chips;
	}
	getArray(number: number) {
		return Array(number).fill(0).map((x, i) => i);
	}
}
