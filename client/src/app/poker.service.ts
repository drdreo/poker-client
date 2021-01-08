import { Injectable, OnDestroy } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { map, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Player } from './table/player/player.component';
import { Card } from './table/card/card.component';
import { NotificationService } from './utils/notification.service';

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
    coins: number;
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

interface GameEnded {
    winner: string;
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

interface GamePlayersUpdate {
    players: PlayerOverview[];
}

interface GameCurrentPlayer {
    currentPlayerID: string;
}

interface GameRoundStarted {
    board: string[];
}

interface GamePotUpdate {
    pot: number;
}


const POKER_API = environment.poker_api;

@Injectable({
    providedIn: 'root'
})
export class PokerService implements OnDestroy {

    private unsubscribe$ = new Subject();

    constructor(private socket: Socket, private http: HttpClient, private notification: NotificationService) {
        this.gameEnded().subscribe(console.log);

        this.playerChecked()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(res => {
                console.log(res);
                this.notification.showAction(`Player[${ res }] checked`);
            });

        this.playerCalled()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(res => {
                console.log(res);
                this.notification.showAction(`Player[${ res }] called`);
            });

        this.playerBet()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(res => {
                console.log(res);
                this.notification.showAction(`Player[${ res }] bet`);
            });

        this.playerFolded()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(res => {
                console.log(res);
                this.notification.showAction(`Player[${ res }] folded`);
            });
    }


    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    fetchHomeInfo(): Observable<HomeInfo> {
        return this.http.get<HomeInfo>(POKER_API + '/home');
    }

    loadTable(tableName: string) {
        return this.http.get<TableResponse>(POKER_API + '/table/' + tableName).toPromise();
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
        return this.socket.fromEvent<undefined>('server:game:started')
                   .pipe(takeUntil(this.unsubscribe$));
    }

    gameEnded() {
        return this.socket.fromEvent<GameEnded>('server:game:ended')
                   .pipe(takeUntil(this.unsubscribe$));
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

    boardUpdated(): Observable<Card[]> {
        return this.socket.fromEvent<GameRoundStarted>('server:game:board_updated')
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

    bet(coins: number) {
        this.socket.emit('player:bet', coins);
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
