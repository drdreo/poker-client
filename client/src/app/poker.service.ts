import { Injectable, OnDestroy } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { map, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Player } from './table/player/player.component';
import { Card } from './table/card/card.component';

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

interface GameStarted {
	cards: string[];
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

interface GameNextPlayer {
	nextPlayerID: string;
}

interface GameRoundStarted {
	board: string[];
}

@Injectable({
	providedIn: 'root',
})
export class PokerService implements OnDestroy {

	private unsubscribe$ = new Subject();

	constructor(private socket: Socket, private http: HttpClient) {
		this.gameEnded().subscribe(console.log);

		this.playerChecked().subscribe(console.log);
		this.playerCalled().subscribe(console.log);
		this.playerBet().subscribe(console.log);
		this.playerFolded().subscribe(console.log);
	}


	ngOnDestroy(): void {
		this.unsubscribe$.next();
		this.unsubscribe$.complete();
	}

	fetchHomeInfo(): Observable<HomeInfo> {
		return this.http.get<HomeInfo>('/api/poker/home');
	}

	loadTable(tableName: string) {
		return this.http.get<TableResponse>('/api/poker/table/' + tableName).toPromise();
	}


	createOrJoinRoom(username: string, tableName: string) {
		this.socket.emit('joinRoom', {playerName: username, roomName: tableName, playerID: localStorage.getItem('playerID')});
	}

	roomJoined() {
		return this.socket.fromEvent<ServerJoined>('server:joined');
	}

	startGame() {
		this.socket.emit('startGame');
	}

	gameEnded() {
		return this.socket.fromEvent<GameEnded>('server:game_ended')
				   .pipe(takeUntil(this.unsubscribe$));
	}

	playersUpdate(): Observable<Player[]> {
		return this.socket.fromEvent<GamePlayersUpdate>('server:player_update')
				   .pipe(map(data => data.players));
	}

	nextPlayer(): Observable<string> {
		return this.socket.fromEvent<GameNextPlayer>('server:game:next_player')
				   .pipe(map(data => data.nextPlayerID));
	}

	boardUpdated(): Observable<Card[]> {
		return this.socket.fromEvent<GameRoundStarted>('server:game:board_updated')
				   .pipe(map(({board}) => {
					   return board.map(card => {
						   const c = card.split('');
						   // remap T to 10
						   c[0] = c[0] === 'T' ? '10' : c[0];
						   return {value: c[0], figure: c[1]};
					   });
				   }));
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
