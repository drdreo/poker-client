import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PokerService } from '../poker.service';
import { switchMap, takeUntil, tap } from 'rxjs/operators';
import { BehaviorSubject, merge, Observable, Subject } from 'rxjs';
import { Card } from './card/card.component';
import { Player } from './player/player.component';
import { NotificationService } from '../utils/notification.service';

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent implements OnInit, OnDestroy {


    /***Comes from server*/
    tableName: string;
    currentPlayerID$: Observable<string>; // ID of the current player
    board$: Observable<Card[]>;
    _players$: BehaviorSubject<Player[]> = new BehaviorSubject<Player[]>([]);
    players$: Observable<Player[]>;
    pot$: Observable<number>;
    /***/

    // set if the current client is a player of the table
    _player$ = new BehaviorSubject<Player>(null);
    player$ = this._player$.asObservable();

    get player(): Player | null {
        return this._player$.getValue();
    }

    showOverlay: boolean = false;
    isCurrentPlayer: boolean = false; // if its the current clients turn
    gameStatus: 'waiting' | 'started' | 'ended' = 'waiting';

    _betAmount$: BehaviorSubject<number> = new BehaviorSubject(0);
    betAmount$ = this._betAmount$.asObservable();

    get betAmount(): number {
        return this._betAmount$.getValue();
    }

    get clientPlayerID(): string {
        return localStorage.getItem('playerID');
    }

    playerColors = [
        '#444444', '#3498db', '#9b59b6',
        '#e67e22', '#3ae374', '#16a085',
        'crimson', '#227093', '#d1ccc0',
        '#34495e', '#673ab7', '#cf6a87'
    ];

    figures = ['S', 'H', 'C', 'D'];
    values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    get cards(): Card[] {
        let all = [];
        for (let figure of this.figures) {
            for (let value of this.values) {
                all.push({
                    figure,
                    value
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

    test_cards(amount: number) {
        let fives = [];
        for (let i = 0; i < amount; i++) {
            let rand_id = Math.floor(Math.random() * this.cards.length);
            fives.push(this.cards[rand_id]);
        }
        return fives;
    }

    unsubscribe$ = new Subject();

    constructor(private route: ActivatedRoute, public notification: NotificationService, public pokerService: PokerService) {
        // init players
        let players = [];
        players.push({
            allIn: false, disconnected: false, folded: false,
            id: '', name: 'rivy331', color: this.getColor(), chips: 667, bet: 579, cards: []
        });
        players.push({
            allIn: false, disconnected: true, folded: false, id: '', name: 'DCer',
            color: this.getColor(), chips: 667, bet: 579, cards: this.two_cards
        });
        players.push({
            allIn: false, disconnected: false, folded: false,
            id: '', name: 'DrDreo', color: this.getColor(), chips: 667, bet: 579, cards: []
        });
        players.push({
            allIn: false, disconnected: false, folded: false,
            id: '', name: 'Hackl', color: this.getColor(), chips: 667, bet: 579, cards: []
        });
        players.push({
            allIn: false, disconnected: false, folded: false,
            id: '', name: 'rivy331', color: this.getColor(), chips: 667, bet: 579, cards: []
        });
        players.push({
            allIn: false, disconnected: false, folded: false,
            id: '', name: 'rivy331', color: this.getColor(), chips: 667, bet: 579, cards: []
        });
        players.push({
            allIn: false, disconnected: false, folded: false,
            id: '', name: 'rivy331', color: this.getColor(), chips: 667, bet: 579, cards: []
        });
        players.push({
            allIn: false, disconnected: false, folded: false,
            id: '', name: 'rivy331', color: this.getColor(), chips: 667, bet: 579, cards: []
        });

        this._players$.next(players);
        this.currentPlayerID$ = this.pokerService.nextPlayer()
                                    .pipe(
                                        tap(currentPlayerID => this.isCurrentPlayer = currentPlayerID === this.clientPlayerID)
                                    );

        this.players$ = merge(
            this._players$,
            this.pokerService.playersUpdate(),
            this.pokerService.playersCards())
            .pipe(tap(players => {
                // look for the current player instance if is one
                if (this.clientPlayerID) {
                    this._player$.next(players.find(player => player.id === this.clientPlayerID) || null);
                }
            }));

        this.board$ = this.pokerService.boardUpdated();
        this.pot$ = this.pokerService.potUpdate();

        this.pokerService.gameStarted()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.gameStatus = 'started');

        this.pokerService.gameEnded()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.gameStatus = 'ended');
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

                this._players$.next(table.players);

                const disconnected = this.player?.disconnected || false;
                if (disconnected) {
                    console.log('Player was disconnected. Try to reconnect!');
                    // reconnect if loading site directly
                    this.pokerService.createOrJoinRoom(this.tableName);
                } else if (!this.clientPlayerID) {
                    // if a new user just joined the table without being at the home screen, join as spectator
                    this.pokerService.createOrJoinRoom(this.tableName);
                }

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
        this.pokerService.bet(this.betAmount);
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

    getArray(number: number) {
        return Array(number).fill(0).map((x, i) => i);
    }

    onBetChange($event: Event) {
        const amount = +(<HTMLInputElement>$event.target).value;
        this._betAmount$.next(amount);
    }
}
