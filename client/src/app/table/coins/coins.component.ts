import { Component, HostBinding, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

@Component({
	selector: 'app-coins',
	templateUrl: './coins.component.html',
	styleUrls: ['./coins.component.scss'],
})
export class CoinsComponent implements OnInit, OnChanges {

	@Input() amount: number;
	@Input() type: number;

	@HostBinding('class.inactive') inactive: boolean = false;

	// available coins
	private coins = [50, 10, 5, 1];

	constructor() { }

	ngOnInit(): void {
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.amount.currentValue && this.getCoinsFor(changes.amount.currentValue, this.type) === 0) {
			this.inactive = true;
		} else {
			this.inactive = false;
		}
	}

	getArray(number: number) {
		return Array(number).fill(0).map((x, i) => i);
	}

	getCoinsFor(total: number, coin: number) {
		// prep coins
		const coins = this.coins.map(c => {
			return {amount: 0, value: c};
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
