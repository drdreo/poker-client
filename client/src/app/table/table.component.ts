import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PokerService } from '../poker.service';
import { switchMap, takeUntil, tap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
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
	currentPlayerID$: Observable<string>; // ID of the current player
	players: Player[] = [];
	pot: number = 524;
	/***/

	showOverlay: boolean = false;
	isPlayer: boolean = false; // if the current client is part of the table
	isCurrentPlayer: boolean = false; // if its the current clients turn

	get clientPlayerID(): string {
		return localStorage.getItem('playerID');
	}

	playerColors = [
		'#444444', '#3498db', '#9b59b6',
		'#e67e22', '#3ae374', '#16a085',
		'crimson', '#227093', '#d1ccc0',
		'#34495e', '#673ab7', '#cf6a87',
	];

	figures = ['S', 'H', 'C', 'D'];
	values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

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

	constructor(private route: ActivatedRoute, public pokerService: PokerService) {
		// init players
		this.players.push({
			allIn: false, disconnected: false, folded: false,
			id: '', name: 'rivy331', color: this.getColor(), chips: 667, bet: 579, cards: [],
		});
		this.players.push({
			allIn: false, disconnected: true, folded: false, id: '', name: 'DCer',
			color: this.getColor(), chips: 667, bet: 579, cards: this.two_cards,
		});
		this.players.push({
			allIn: false, disconnected: false, folded: false,
			id: '', name: 'DrDreo', color: this.getColor(), chips: 667, bet: 579, cards: [],
		});
		this.players.push({
			allIn: false, disconnected: false, folded: false,
			id: '', name: 'Hackl', color: this.getColor(), chips: 667, bet: 579, cards: [],
		});
		this.players.push({
			allIn: false, disconnected: false, folded: false,
			id: '', name: 'rivy331', color: this.getColor(), chips: 667, bet: 579, cards: [],
		});
		this.players.push({
			allIn: false, disconnected: false, folded: false,
			id: '', name: 'rivy331', color: this.getColor(), chips: 667, bet: 579, cards: [],
		});
		this.players.push({
			allIn: false, disconnected: false, folded: false,
			id: '', name: 'rivy331', color: this.getColor(), chips: 667, bet: 579, cards: [],
		});
		this.players.push({
			allIn: false, disconnected: false, folded: false,
			id: '', name: 'rivy331', color: this.getColor(), chips: 667, bet: 579, cards: [],
		});


		this.currentPlayerID$ = this.pokerService.nextPlayer()
									.pipe(
										tap(currentPlayerID => this.isCurrentPlayer = currentPlayerID === this.clientPlayerID),
									);

		this.pokerService.playersUpdate()
			.pipe(takeUntil(this.unsubscribe$))
			.subscribe(({players}) => {
				this.players = players;
			});


		this.pokerService.gameStarted()
			.pipe(takeUntil(this.unsubscribe$))
			.subscribe(({cards}) => {
				console.log(cards);
				this.players.find(player => player.id === this.clientPlayerID).cards = cards.map(card => {
					const c = card.split('');
					// remap T to 10
					c[0] = c[0] === 'T' ? '10' : c[0];
					return {value: c[0], figure: c[1]};
				});
			});

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
				this.players = table.players;
				this.isPlayer = table.players.some(player => player.id === this.clientPlayerID);
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

	bet(amount: number) {
		this.pokerService.bet(amount);
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
