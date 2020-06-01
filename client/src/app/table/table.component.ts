import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PokerService } from '../poker.service';
import { switchMap, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
	selector: 'app-table',
	templateUrl: './table.component.html',
	styleUrls: ['./table.component.scss'],
})
export class TableComponent implements OnInit, OnDestroy {

	showOverlay: boolean = false;
	isPlayer: boolean = false;


	playerColors = [
		'#444444', '#3498db', '#9b59b6',
		'#e67e22', '#3ae374', '#16a085',
		'crimson', '#227093', '#d1ccc0',
		'#34495e', '#673ab7', '#cf6a87',
	];
	table: string;

	player_playing = 0;
	players = [];

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

	get cards() {
		let all = [];
		for (let figure of this.figures) {
			for (let value of this.values) {
				all.push({
					f: figure,
					v: value,
				});
			}
		}
		return all;
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
		this.players.push({name: 'rivy331', color: this.getColor(), bank: 228, onTable: 79, hasCards: true});
		this.players.push({name: 'kattar2', color: this.getColor(), bank: 999, onTable: 0, hasCards: true});
		this.players.push({name: 'mikelaire3', color: this.getColor(), bank: 100, onTable: 21, hasCards: true});
		this.players.push({name: 'tomtom4', color: this.getColor(), bank: 100, onTable: 26, hasCards: true});
		this.players.push({name: 'nana5', color: this.getColor(), bank: 999, onTable: 579, hasCards: true});
		this.players.push({name: 'ionion6', color: this.getColor(), bank: 6, onTable: 5, hasCards: true});
		this.players.push({name: 'ionion7', color: this.getColor(), bank: 1, onTable: 1, hasCards: true});
		this.players.push({name: 'ionion8', color: this.getColor(), bank: 100, onTable: 22, hasCards: true});
	}

	ngOnInit() {
		this.route.paramMap
			.pipe(
				switchMap(params => {
					const table = params.get('tableName');
					this.table = table;
					return this.pokerService.loadTable(table);
				}),
				takeUntil(this.unsubscribe$))
			.subscribe(table => {
				console.log(table);
				this.players = table.players;
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
}
