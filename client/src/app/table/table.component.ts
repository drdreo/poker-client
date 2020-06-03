import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PokerService } from '../poker.service';
import { switchMap, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Card } from './card/card.component';
import { Player } from './player/player.component';

@Component({
	selector: 'app-table',
	templateUrl: './table.component.html',
	styleUrls: ['./table.component.scss'],
})
export class TableComponent implements OnInit, OnDestroy {


	/***Comes from server*/
	tableName: string;
	currentPlayer = 0; // index of the current player
	players: Player[] = [];
	pot: number = 524;
	/***/

	showOverlay: boolean = false;
	isPlayer: boolean = false;

	playerColors = [
		'#444444', '#3498db', '#9b59b6',
		'#e67e22', '#3ae374', '#16a085',
		'crimson', '#227093', '#d1ccc0',
		'#34495e', '#673ab7', '#cf6a87',
	];

	figures = ['P', 'H', 'C', 'D'];
	values = [
		'1',
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9',
		'10',
		'V',
		'D',
		'K',
	];

	get cards(): Card[] {
		let all = [];
		for (let figure of this.figures) {
			for (let value of this.values) {
				all.push({
					figure,
					value,
				});
			}
		}
		return all;
	}

	get two_cards() {
		let cards = [];
		for (let i = 0; i < 2; i++) {
			let rand_id = Math.floor(Math.random() * this.cards.length);
			cards.push(this.cards[rand_id]);
		}
		return cards;
	}

	get five_cards() {
		let fives = [];
		for (let i = 0; i < 5; i++) {
			let rand_id = Math.floor(Math.random() * this.cards.length);
			fives.push(this.cards[rand_id]);
		}
		return fives;
	}

	unsubscribe$ = new Subject();

	constructor(private route: ActivatedRoute, private pokerService: PokerService) {
		// init players
		this.players.push({name: 'rivy331', color: this.getColor(), chips: 667, bet: 579, cards: []});
		this.players.push({name: 'kattar2', color: this.getColor(), chips: 667, bet: 579, cards: this.two_cards});
		this.players.push({name: 'mikelaire3', color: this.getColor(), chips: 667, bet: 579});
		this.players.push({name: 'tomtom4', color: this.getColor(), chips: 667, bet: 579});
		this.players.push({name: 'nana5', color: this.getColor(), chips: 667, bet: 579});
		this.players.push({name: 'ionion6', color: this.getColor(), chips: 999, bet: 5});
		this.players.push({name: 'ionion7', color: this.getColor(), chips: 1, bet: 1});
		this.players.push({name: 'ionion8', color: this.getColor(), chips: 100, bet: 22});

		setTimeout(() => {
			this.pot = 500;
		}, 3009);
		setTimeout(() => {
			this.pot = 579;
		}, 5009);
	}

	ngOnInit() {
		this.route.paramMap
			.pipe(
				switchMap(params => {
					const table = params.get('tableName');
					this.tableName = table;
					return this.pokerService.loadTable(table);
				}),
				takeUntil(this.unsubscribe$))
			.subscribe(table => {
				console.log(table);
				this.players = table.players.map(player => {
					return {...player, color: this.getColor()};
				});

				this.isPlayer = table.players.some(player => player.id === localStorage.getItem('playerID'));
			}, error => {
				console.log(error);
				this.showOverlay = true;
			});

	}

	ngOnDestroy() {
		this.unsubscribe$.next();
		this.unsubscribe$.complete();
	}

	startGame() {
		this.pokerService.startGame();
	}

	check() {
		this.pokerService.check();
	}

	call() {
		this.pokerService.call();
	}

	bet() {
		this.pokerService.bet(100);
	}

	fold() {
		this.pokerService.fold();
	}

	/**********************
	 * HELPER
	 */


	private getColor() {
		return this.playerColors.pop();
	}

	private colorTaken(color) {
		return this.players.some(player => player.color === color);
	}

	getArray(number: number) {
		return Array(number).fill(0).map((x, i) => i);
	}

}
