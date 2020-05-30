import { Component, Input, OnInit } from '@angular/core';

@Component({
	selector: 'app-player',
	templateUrl: './player.component.html',
	styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements OnInit {

	@Input() player;
	@Input() currentPlayer;
	@Input() index;

	constructor() { }

	ngOnInit() {
	}

	getCoinsIterateable(number: number) {
		return Array(number).fill(0).map((x,i)=>i)
	}
}
