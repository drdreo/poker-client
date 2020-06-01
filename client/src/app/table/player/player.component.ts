import { Component, Input, OnInit } from '@angular/core';

interface Player {
	name:string;
	chips:number;
	bet:number;
	color:string;
}

@Component({
	selector: 'app-player',
	templateUrl: './player.component.html',
	styleUrls: ['./player.component.scss'],
})
export class PlayerComponent implements OnInit {

	@Input() player: Player;
	@Input() currentPlayer;
	@Input() index;


	// available coins
	coins = [50, 10, 5, 1];


	constructor() { }

	ngOnInit() {
	}

	getArray(number: number) {
		return Array(number).fill(0).map((x,i)=>i)
	}

	getCoinsFor(total: number, coin: number) {
		// prep coins
		const coins = this.coins.map(c => {
			return {amount:0, value:c}
		});

		let tmp_rest = total;

		for (let c of coins) {
			if (tmp_rest <= 0) {
				break;
			}

			while (tmp_rest - c.value >= 0) {
				tmp_rest -= c.value;
				c.amount++;
			}
		}

		return coins.find(c => c.value === coin).amount;
	}
}
