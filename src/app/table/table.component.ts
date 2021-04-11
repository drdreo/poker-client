import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as Sentry from '@sentry/angular';
import { GameStatus, Card, BetType, SidePot, PlayerOverview } from '@shared/src';
import { formatWinnersMessage } from 'app/shared/utils';
import { BehaviorSubject, merge, Observable, Subject, interval, timer } from 'rxjs';
import { switchMap, takeUntil, tap, shareReplay, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PokerService } from '../poker.service';
import { cardFadeInAnimation, controlsFadeAnimation } from '../shared/animations';
import { AudioService, Sounds } from '../shared/audio.service';
import { NotificationService } from '../shared/notification.service';
import { TitleService } from '../shared/title.service';
import { MessageType } from './feed/feed-message/feed-message.component';
import { Player } from './player/player.component';

@Sentry.TraceClassDecorator()
@Component({
    selector: 'poker-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [cardFadeInAnimation, controlsFadeAnimation]
})
export class TableComponent implements OnInit, OnDestroy {

    inProduction = environment.production;
    showOverlay = false;
    isCurrentPlayer = false; // if its the current clients turn
    playDuration$ = interval(1000).pipe(map((count) => this.startTime + count * 1000));
    turnTimer$: Observable<number>;
    stopTurnTimer$ = new Subject();

    get clientPlayerID(): string {
        return sessionStorage.getItem('playerID');
    }

    /***Comes from server*/
    tableName: string;
    startTime: number;
    config: any;
    currentPlayerID$: Observable<string>; // ID of the current player
    dealerPlayerID$: Observable<string>; // ID of the dealer
    board$: Observable<Card[]>;
    pot$: Observable<number>;
    sidePots$: Observable<SidePot[]>;
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


    private _gameStatus$ = new BehaviorSubject<GameStatus>(GameStatus.Waiting);
    gameStatus$ = this._gameStatus$.asObservable();

    // maybe refactor to better data structure if more come up
    private _maxBet$ = new BehaviorSubject<number>(0);
    maxBet$ = this._maxBet$.asObservable();

    get maxBet(): number {
        return this._maxBet$.getValue();
    }

    private unsubscribe$ = new Subject();

    constructor(
        private route: ActivatedRoute,
        public notification: NotificationService,
        public pokerService: PokerService,
        private audio: AudioService,
        private titleService: TitleService) {

        this.notification.clearAction();

        this.currentPlayerID$ = this.pokerService.currentPlayer()
                                    .pipe(
                                        tap(playerID => this.setCurrentPlayer(playerID)),
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

        this.players$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(players => {
                // look for the current player instance if is one
                if (this.clientPlayerID) {
                    this._player$.next(players.find(player => player.id === this.clientPlayerID) || null);
                }
            });

        this.board$ = this.pokerService.boardUpdated();
        this.pot$ = this.pokerService.mainPotUpdate()
                        .pipe(
                            tap(() => this.audio.play(Sounds.ChipsBet)),
                            shareReplay(1)
                        );

        this.sidePots$ = this.pokerService.sidePotUpdate();

        this.pokerService.maxBetUpdate()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((bet) => {
                console.log({ bet });
                this._maxBet$.next(bet);
            });


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
            .subscribe(() => {
                this._gameStatus$.next(GameStatus.Started);
                this.notification.clearAction();
            });

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
                if (status === 'started' || status === 'ended') {
                    this._gameStatus$.next(status);
                } else {
                    this._gameStatus$.next(GameStatus.Waiting);
                }
            });

        this.pokerService.gameWinners()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(({ winners }) => {
                console.log({ winners });

                if (winners.length === 0) {
                    console.error('Server sent us no winners at all!');
                }

                const message = formatWinnersMessage(winners);

                this.notification.showAction(message);
                this.notification.addFeedMessage(message, MessageType.Won);
            });

        this.pokerService.playerChecked()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(res => {
                const player = this.getPlayerById(res.playerID);
                this.notification.showAction(`${ player.name } checked`);
                this.notification.addFeedMessage(`${ player.name } checked`, MessageType.Played);
            });

        // this.pokerService.playerCalled()
        //     .pipe(takeUntil(this.unsubscribe$))
        //     .subscribe(res => {
        //         const player = this.getPlayerById(res.playerID);
        //         this.notification.showAction(`${ player.name } called`);
        //         this.notification.addFeedMessage(`${ player.name } called`, MessageType.Played);
        //     });

        this.pokerService.playerBet()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(({ bet, maxBet, type, playerID }) => {
                    const player = this.getPlayerById(playerID);
                    this._maxBet$.next(maxBet);

                    let actionMessage;
                    let feedMessage;
                    let feedMessageType;

                    if (type === BetType.Bet) {
                        actionMessage = `${ player.name } bet ${ bet }`;
                        feedMessage = actionMessage;
                        feedMessageType = MessageType.Played;
                    } else if (type === BetType.SmallBlind) {
                        feedMessage = `${ player.name } is small blind with ${ bet }`;
                        feedMessageType = MessageType.Played;
                    } else if (type === BetType.BigBlind) {
                        feedMessage = `${ player.name } is big blind with ${ bet }`;
                        feedMessageType = MessageType.Played;
                    } else if (type === BetType.Call) {
                        actionMessage = `${ player.name } called`;
                        feedMessage = actionMessage;
                        feedMessageType = MessageType.Played;
                    } else if (type === BetType.AllIn) {
                        actionMessage = `${ player.name } went all in with ${ bet }!`;
                        feedMessage = actionMessage;
                        feedMessageType = MessageType.Played;
                    }

                    if (actionMessage) {
                        this.notification.showAction(actionMessage);
                    }

                    if (feedMessage && feedMessageType) {
                        this.notification.addFeedMessage(feedMessage, feedMessageType);
                    }
                }
            );

        this.pokerService.playerFolded()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(res => {
                const player = this.getPlayerById(res.playerID);

                this.notification.showAction(`${ player.name } folded`);
                this.notification.addFeedMessage(`${ player.name } folded`, MessageType.Played);
            });

        this.pokerService.playerKicked()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(name => {
                this.notification.addFeedMessage(`${ name } was kicked from the table!`, MessageType.Error);
            });
    }

    private setCurrentPlayer(newPlayerID: string): void {
        this.isCurrentPlayer = newPlayerID === this.clientPlayerID;

        if (this.isCurrentPlayer) {
            this.startTurnTimer();
            this.titleService.addTitle(' ❗ YOU TURN ❗ ');
        } else {
            this.titleService.addTitle('Waiting');
        }
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
                // @ts-ignore
                this.config = table.config;

                const isPlayer = table.players.find(player => player.id === this.clientPlayerID);

                const disconnected = isPlayer?.disconnected || false;
                if (disconnected) {
                    console.log('Player was disconnected. Try to reconnect!');
                    // reconnect if loading site directly
                    this.pokerService.createOrJoinRoom(this.tableName);

                } else if (!isPlayer) {
                    // @ts-ignore
                    if (table.config.spectatorsAllowed === false) {
                        throw new Error('Not allowed to spectate!');
                    }

                    console.log('Joining as spectator!');
                    // if a new user just joined the table without being at the home screen, join as spectator
                    this.pokerService.joinAsSpectator(this.tableName);
                }

                this.startTime = new Date().getTime() - new Date(table.startTime).getTime();
                this._players$.next(table.players);

                this.pokerService.requestUpdate();
            }, error => {
                if (!environment.production) {
                    this.loadDevThings();
                }
                this.showOverlay = true;
            });


    }

    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    @HostListener('window:focus', ['$event'])
    documentFocused(event: FocusEvent) {
        this.titleService.endAnimation();
    }

    @HostListener('window:blur', ['$event'])
    documentBlurred(event: FocusEvent) {
        this.titleService.startAnimation();
    }


    startGame() {
        if (this.players.length > 1) {
            this.pokerService.startGame();
        }
    }

    check() {
        this.pokerService.check();
        this.endTurnTimer();
    }

    call() {
        this.pokerService.call();
        this.endTurnTimer();
    }

    bet(bet: number) {
        const betableAmount = this.player.chips + (this.player.bet ? this.player.bet.amount : 0);
        if (betableAmount < bet) {
            this.notification.showAction(`Not enough chips to bet ${ bet }!`, 'error');
            return;
        }

        this.pokerService.bet(bet);
        this.endTurnTimer();
    }

    fold() {
        this.pokerService.fold();
        this.endTurnTimer();
    }

    /**********************
     * HELPER
     */

    private getPlayerById(playerID: string): Player {
        return this.players.find(player => player.id === playerID);
    }


    getArray(num: number) {
        return Array(num).fill(0).map((x, i) => i);
    }

    trackCardValue(index: number, card: Card): number {
        return index;
    }

    private loadDevThings() {
        console.log('Loading dev data!');
        setTimeout(() => {
            this.audio.play(Sounds.ChipsBet);
        }, 2000);
        this.loadDevPlayers();

        const devPotSubject = new BehaviorSubject<number>(666);
        const devSidePots = [{ amount: 60, players: [this.players[0], this.players[1]] }];
        const devsidePotsSubject = new BehaviorSubject<SidePot[]>(devSidePots);
        const devBoardSubject = new BehaviorSubject<Card[]>([]);
        this.pot$ = devPotSubject.asObservable();
        this.sidePots$ = devsidePotsSubject.asObservable();
        this.board$ = devBoardSubject.asObservable();

        this.loadDevSidepots(devsidePotsSubject);

        for (let i = 1; i < 6; i++) {
            setTimeout(() => devBoardSubject.next([...devBoardSubject.value, this.players[0].cards[0]]), 1000 * i);
        }

        setTimeout(() => devBoardSubject.next([]), 7000);

        this._maxBet$.next(579);
    }

    private loadDevSidepots(devsidePotsSubject) {
        setTimeout(() => devsidePotsSubject.next([...devsidePotsSubject.value, {
            amount: 100,
            players: [this.players[1], this.players[2]]
        }]), 1500);

        setTimeout(() => devsidePotsSubject.next([...devsidePotsSubject.value, {
            amount: 333,
            players: [this.players[1], this.players[2]]
        }]), 3000);

        // clear sidepots
        // setTimeout(() => devsidePotsSubject.next([]), 5000);
    }

    private loadDevPlayers() {

        const playerColors = [
            '#444444', '#3498db', '#9b59b6',
            '#e67e22', '#3ae374', '#16a085',
            'crimson', '#227093', '#d1ccc0',
            '#34495e', '#673ab7', '#cf6a87'
        ];

        const figures = ['S', 'H', 'C', 'D'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

        const generateCards = (): Card[] => {
            const all = [];
            for (const figure of figures) {
                for (const value of values) {
                    all.push({
                        figure,
                        value
                    });
                }
            }
            return all;
        };

        const cards = generateCards();

        const test_cards = (amount: number) => {
            const fives = [];
            for (let i = 0; i < amount; i++) {
                const rand_id = Math.floor(Math.random() * cards.length);
                fives.push(cards[rand_id]);
            }
            return fives;
        };

        const getColor = () => playerColors.pop();

        // init players
        const players: PlayerOverview[] = [];
        players.push({
            allIn: false,
            disconnected: false,
            afk: false,
            folded: false,
            id: 'tester1',
            name: 'thatN00b',
            color: getColor(),
            chips: 667,
            bet: { amount: 579, type: BetType.Bet },
            cards: [{ figure: 'back', value: 0 }, { figure: 'back', value: 0 }],
            kickVotes: []
        });
        players.push({
            kickVotes: [],
            allIn: false, disconnected: true, afk: false, folded: false, id: 'tester2', name: 'DCer',
            color: getColor(), chips: 667, bet: { amount: 579, type: BetType.Bet }, cards: test_cards(2)
        });
        players.push({
            kickVotes: [],
            allIn: false, disconnected: false, afk: false, folded: false,
            id: 'tester3', name: 'DrDreo', color: getColor(), chips: 667, bet: { amount: 579, type: BetType.Bet }, cards: test_cards(2)
        });
        players.push({
            kickVotes: [],
            allIn: false, disconnected: false, afk: false, folded: false,
            id: 'tester4', name: 'Hackl', color: getColor(), chips: 667, bet: { amount: 579, type: BetType.Bet }, cards: test_cards(2)
        });
        players.push({
            kickVotes: [],
            allIn: false, disconnected: true, afk: true, folded: true,
            id: 'tester5', name: 'DC / AFKer', color: getColor(), chips: 667, bet: { amount: 579, type: BetType.Bet }, cards: test_cards(2)
        });
        players.push({
            kickVotes: [],
            allIn: false, disconnected: false, afk: false, folded: false,
            id: 'tester6', name: 'Autophytes', color: getColor(), chips: 667, bet: { amount: 579, type: BetType.Bet }, cards: test_cards(2)
        });
        players.push({
            kickVotes: [],
            allIn: true, disconnected: false, afk: true, folded: false,
            id: 'tester7', name: 'AFKer', color: getColor(), chips: 0, bet: { amount: 4000, type: BetType.Bet }, cards: test_cards(2)
        });
        players.push({
            kickVotes: [],
            allIn: false, disconnected: false, afk: false, folded: false,
            id: 'dealer', name: 'Dealer', color: getColor(), chips: 3667, bet: { amount: 579, type: BetType.Bet }, cards: test_cards(2)
        });

        this._players$.next(players);
        this._player$.next(players[2]);
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

    voteKick(id: string) {
        this.pokerService.voteKick(id);
    }

    private startTurnTimer() {
        const seconds = this.config.inactiveDelay / 1000;
        this.turnTimer$ = interval(1000).pipe(
            map(num => seconds - 1 - (num + 1)),
            takeUntil(timer(this.config.inactiveDelay)),
            takeUntil(this.stopTurnTimer$),
            takeUntil(this.unsubscribe$)
        );
    }

    private endTurnTimer() {
        this.stopTurnTimer$.next();
    }

}
