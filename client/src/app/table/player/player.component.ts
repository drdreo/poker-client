import { Component, Input, OnInit } from '@angular/core';
import { Card } from '../card/card.component';

export interface Player {
	name: string;
	chips: number;
	bet: number;
	color: string;
	cards?: Card[];
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

	getArray(number: number) {
		return Array(number).fill(0).map((x, i) => i);
	}
}
