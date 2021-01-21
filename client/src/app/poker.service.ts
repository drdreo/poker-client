import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { Card } from './table/card/card.component';
import { Player } from './table/player/player.component';
import { GameStatus } from './table/table.component';

interface PlayerChecked {
    playerID: string;
}

interface PlayerCalled {
    playerID: string;
}

interface PlayerFolded {
    playerID: string;
}

interface PlayerBet {
    playerID: string;
    bet: number;
    type: BetType
}

export enum BetType {
    SmallBlind,
    BigBlind,
    Bet,
    Raise,
    ReRaise,
}

export interface PokerTable {
    name: string;
    started: boolean;
}

export interface HomeInfo {
    tables: PokerTable[];
    players: number;
}

export interface TableResponse {
    name: string;
    players: PlayerOverview[];
}

interface ServerJoined {
    playerID: string;
}

interface PlayerLeft {
    playerID: string;
}

interface GameWinners {
    winners: Winner[];
    pot: number;
}

interface PlayerOverview {
    id: string;
    name: string;
    chips: number;
    color: string;
    cards?: Card[];
    allIn: boolean;
    folded: boolean;
    disconnected: boolean;
}

interface Winner extends PlayerOverview {
    hand?: {
        handName: string;
        handType: number;
    }
}

interface GamePlayersUpdate {
    players: PlayerOverview[];
}

interface GameCurrentPlayer {
    currentPlayerID: string;
}

interface GameDealerUpdate {
    dealerPlayerID: string;
}

interface GameBoardUpdate {
    board: string[];
}

interface GamePotUpdate {
    pot: number;
}

interface GameRoundUpdate {
    round: any;
}


const POKER_API = environment.poker_api;

@Injectable({
    providedIn: 'root'
})
export class PokerService implements OnDestroy {

    private unsubscribe$ = new Subject();

    constructor(private socket: Socket, private http: HttpClient) {

    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    loadTable(tableName: string) {
        return this.http.get<TableResponse>(POKER_API + '/table/' + tableName).toPromise();
    }

    loadHomeInfo() {
        return this.http.get<HomeInfo>(POKER_API + '/home');
    }

    homeInfo() {
        return this.socket.fromEvent<HomeInfo>('server:home:info');
    }

    createOrJoinRoom(tableName: string, username?: string) {
        this.socket.emit('joinRoom', { playerName: username, roomName: tableName, playerID: localStorage.getItem('playerID') });
    }

    roomJoined() {
        return this.socket.fromEvent<ServerJoined>('server:joined');
    }

    startGame() {
        this.socket.emit('startGame');
    }

    gameStarted() {
        return this.socket.fromEvent<undefined>('server:game:started');
    }

    gameEnded(): Observable<undefined> {
        return this.socket.fromEvent<undefined>('server:game:ended');
    }

    gameStatus(): Observable<GameStatus> {
        return this.socket.fromEvent<GameStatus>('server:game:status');
    }

    gameWinners(): Observable<GameWinners> {
        return this.socket.fromEvent<GameWinners>('server:game:winners');
    }

    leave() {
        this.socket.emit('player:leave');
    }

    playerleft(): Observable<PlayerLeft> {
        return this.socket.fromEvent<PlayerLeft>('server:player:left');
    }

    playersUpdate(): Observable<Player[]> {
        return this.socket.fromEvent<GamePlayersUpdate>('server:players_update')
                   .pipe(map(data => data.players));
    }

    // basically like playersUpdate but includes everyones cards
    playersCards(): Observable<Player[]> {
        return this.socket.fromEvent<GamePlayersUpdate>('server:players_cards')
                   .pipe(map(data => data.players));
    }

    currentPlayer(): Observable<string> {
        return this.socket.fromEvent<GameCurrentPlayer>('server:game:current_player')
                   .pipe(map(data => data.currentPlayerID));
    }

    dealerUpdate(): Observable<string> {
        return this.socket.fromEvent<GameDealerUpdate>('server:game:dealer')
                   .pipe(map(data => data.dealerPlayerID));
    }

    boardUpdated(): Observable<Card[]> {
        return this.socket.fromEvent<GameBoardUpdate>('server:game:board_updated')
                   .pipe(map(({ board }) => {
                       return board.map(card => {
                           const c = card.split('');
                           // remap T to 10
                           c[0] = c[0] === 'T' ? '10' : c[0];
                           return { value: c[0], figure: c[1] };
                       });
                   }));
    }

    potUpdate(): Observable<number> {
        return this.socket.fromEvent<GamePotUpdate>('server:pot_update')
                   .pipe(map(data => data.pot));
    }


    roundUpdate(): Observable<any> {
        return this.socket.fromEvent<GameRoundUpdate>('server:game:new_round')
                   .pipe(map(data => data.round));
    }

    tableClosed(): Observable<undefined> {
        return this.socket.fromEvent<undefined>('server:table:closed');
    }

    /********************
     * Game Actions
     ********************/

    check() {
        this.socket.emit('player:check');
    }

    playerChecked() {
        return this.socket.fromEvent<PlayerChecked>('server:checked');
    }

    call() {
        this.socket.emit('player:call');
    }

    playerCalled() {
        return this.socket.fromEvent<PlayerCalled>('server:called');
    }

    bet(amount: number) {
        this.socket.emit('player:bet', amount);
    }

    playerBet() {
        return this.socket.fromEvent<PlayerBet>('server:bet');
    }

    fold() {
        this.socket.emit('player:fold');
    }

    playerFolded() {
        return this.socket.fromEvent<PlayerFolded>('server:folded');
    }
}
