import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, merge, Observable, Subject, interval } from 'rxjs';
import { switchMap, takeUntil, tap, shareReplay } from 'rxjs/operators';
import { GameStatus, Card, BetType } from '../../../../shared/src';
import { environment } from '../../environments/environment';
import { PokerService } from '../poker.service';
import { NotificationService } from '../utils/notification.service';
import { MessageType } from './feed/feed-message/feed-message.component';
import { Player } from './player/player.component';

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent implements OnInit, OnDestroy {


    inProduction = environment.production;

    /***Comes from server*/
    tableName: string;
    currentPlayerID$: Observable<string>; // ID of the current player
    dealerPlayerID$: Observable<string>; // ID of the dealer
    board$: Observable<Card[]>;
    pot$: Observable<number>;
    /***/

    private _players$: BehaviorSubject<Player[]> = new BehaviorSubject<Player[]>([]);
    players$: Observable<Player[]> = this._players$.asObservable();

    get players(): Player[] {
        return this._players$.getValue();
    }

    // set if the current client is a player of the table
    private _player$ = new BehaviorSubject<Player>(null);
    player$ = this._player$.asObservable();

    get player(): Player | null {
        return this._player$.getValue();
    }

    showOverlay: boolean = false;
    isCurrentPlayer: boolean = false; // if its the current clients turn

    private _gameStatus$ = new BehaviorSubject<GameStatus>(GameStatus.Waiting);
    gameStatus$ = this._gameStatus$.asObservable();

    _betAmount$: BehaviorSubject<number> = new BehaviorSubject(0);
    betAmount$ = this._betAmount$.asObservable();

    get betAmount(): number {
        return this._betAmount$.getValue();
    }

    playDuration$ = interval(1000);

    // maybe refactor to better data structure if more come up
    private _maxBet$ = new BehaviorSubject<number>(0);
    maxBet$ = this._maxBet$.asObservable();

    get maxBet(): number {
        return this._maxBet$.getValue();
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

        this.loadDevPlayers();

        this.currentPlayerID$ = this.pokerService.currentPlayer()
                                    .pipe(
                                        tap(console.log),
                                        tap(playerID => this.isCurrentPlayer = playerID === this.clientPlayerID),
                                        shareReplay(1)  // got to shareReplay due to late subscriptions inside the template
                                    );

        this.dealerPlayerID$ = this.pokerService.dealerUpdate()
                                   .pipe(shareReplay(1));


        merge(
            this.pokerService.playersUpdate(),
            this.pokerService.playersCards()
        ).subscribe(players => {
            this._players$.next(players);
        });

        this.players$.subscribe(players => {
            // look for the current player instance if is one
            if (this.clientPlayerID) {
                this._player$.next(players.find(player => player.id === this.clientPlayerID) || null);
            }
        });

        this.board$ = this.pokerService.boardUpdated();
        this.pot$ = this.pokerService.potUpdate();

        this.pokerService.playerLeft()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                const player = this.getPlayerById(res.playerID);
                this.notification.addFeedMessage(`${ player.name } left the table`, MessageType.Left);
            });

        this.pokerService.roundUpdate()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this._maxBet$.next(0);
            });

        this.pokerService.gameStarted()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this._gameStatus$.next(GameStatus.Started));

        this.pokerService.gameEnded()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this._gameStatus$.next(GameStatus.Ended);
            });

        this.pokerService.tableClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {

                const winner = this.players[0];
                const message = `${ winner.name } won the game.`;
                this.notification.showAction(message + ' GG WP!');
                this.notification.addFeedMessage(message, MessageType.Won);
                this.notification.addFeedMessage('Table will be closed now. Reopen a new one!', MessageType.Info);
            });

        this.pokerService.gameStatus()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((status) => {
                console.log('Game Status: ' + status);
                if (status == 'started' || status == 'ended') {
                    this._gameStatus$.next(status);
                } else {
                    this._gameStatus$.next(GameStatus.Waiting);
                }
            });

        this.pokerService.gameWinners()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(({ winners }) => {
                console.log(winners);

                if (winners.length === 0) {
                    console.error('Server sent us no winners at all!');
                }

                let message = '';
                if (winners.length === 1) {
                    message = `${ winners[0].name } won the pot of ${ winners[0].amount }`;
                    if (winners[0].hand) {
                        message += ` with ${ winners[0].hand.handName }`;
                    }
                } else {
                    const winnerNames = winners.reduce((prev, cur) => prev + ' ' + cur.name, '');
                    const winnerPots = winners.reduce((prev, cur) => prev + ',' + cur.amount, '');
                    message = `${ winnerNames } won the pots of ${ winnerPots }`;
                }

                this.notification.showAction(message);
                this.notification.addFeedMessage(message, MessageType.Won);
            });

        this.pokerService.playerChecked()
            .pipe(
                tap(console.log),
                takeUntil(this.unsubscribe$)
            )
            .subscribe(res => {
                const player = this.getPlayerById(res.playerID);
                this.notification.showAction(`${ player.name } checked`);
                this.notification.addFeedMessage(`${ player.name } checked`, MessageType.Played);
            });

        this.pokerService.playerCalled()
            .pipe(
                tap(console.log),
                takeUntil(this.unsubscribe$)
            )
            .subscribe(res => {
                const player = this.getPlayerById(res.playerID);
                this.notification.showAction(`${ player.name } called`);
                this.notification.addFeedMessage(`${ player.name } called`, MessageType.Played);
            });

        this.pokerService.playerBet()
            .pipe(
                tap(console.log),
                takeUntil(this.unsubscribe$)
            )
            .subscribe(res => {
                const player = this.getPlayerById(res.playerID);
                this._maxBet$.next(res.maxBet);


                if (res.type === BetType.Bet) {
                    this.notification.showAction(`${ player.name } bet ${ res.bet }`);
                    this.notification.addFeedMessage(`${ player.name } bet ${ res.bet }`, MessageType.Played);
                } else if (res.type === BetType.SmallBlind) {
                    this.notification.addFeedMessage(`${ player.name } is small blind with ${ res.bet }`, MessageType.Played);
                } else if (res.type === BetType.BigBlind) {
                    this.notification.addFeedMessage(`${ player.name } is big blind with ${ res.bet }`, MessageType.Played);
                }

            });

        this.pokerService.playerFolded()
            .pipe(
                tap(console.log),
                takeUntil(this.unsubscribe$)
            )
            .subscribe(res => {
                const player = this.getPlayerById(res.playerID);

                this.notification.showAction(`${ player.name } folded`);
                this.notification.addFeedMessage(`${ player.name } folded`, MessageType.Played);
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

                this._players$.next(table.players);

                const disconnected = this.player?.disconnected || false;
                if (disconnected) {
                    console.log('Player was disconnected. Try to reconnect!');
                    // reconnect if loading site directly
                    this.pokerService.createOrJoinRoom(this.tableName);

                } else if (!this.clientPlayerID) {
                    console.log('Joined as spectator!');
                    // if a new user just joined the table without being at the home screen, join as spectator
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

    private getPlayerById(playerID: string): Player {
        return this.players.find(player => player.id === playerID);
    }

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

    private loadDevPlayers() {
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
            id: 'dealer', name: 'Dealer', color: this.getColor(), chips: 667, bet: 579, cards: []
        });

        this._players$.next(players);
    }

    getPlayerSeat(index: number) {
        const totalPlayers = this.players.length;

        // hardcode the placement of players to their seat
        switch (totalPlayers) {
            case 2:
                if (index === 0) {
                    return 1;
                } else if (index === 1) {
                    return 5;
                }
                break;

            case 3:
                if (index === 0) {
                    return 1;
                } else if (index === 1) {
                    return 3;
                } else if (index === 2) {
                    return 5;
                }
                break;

            case 4:
                if (index === 0) {
                    return 1;
                } else if (index === 1) {
                    return 3;
                } else if (index === 2) {
                    return 5;
                } else if (index === 3) {
                    return 7;
                }
                break;

            case 5:
                if (index === 0) {
                    return 1;
                } else if (index === 1) {
                    return 2;
                } else if (index === 2) {
                    return 3;
                } else if (index === 3) {
                    return 5;
                } else if (index === 4) {
                    return 7;
                }
                break;

            case 6:
                if (index === 0) {
                    return 1;
                } else if (index === 1) {
                    return 2;
                } else if (index === 2) {
                    return 3;
                } else if (index === 3) {
                    return 5;
                } else if (index === 4) {
                    return 6;
                } else if (index === 5) {
                    return 7;
                }
                break;

            case 7:
                if (index === 0) {
                    return 1;
                } else if (index === 1) {
                    return 2;
                } else if (index === 2) {
                    return 3;
                } else if (index === 3) {
                    return 4;
                } else if (index === 4) {
                    return 5;
                } else if (index === 5) {
                    return 6;
                } else if (index === 6) {
                    return 7;
                }
                break;

            case 8:
            default:
                return index + 1;
        }

    }
}
