import { Injectable, OnDestroy } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { map, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Player } from './table/player/player.component';

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

interface PlayerOverview {
	id: string;
	name: string;
	color: string;
	chips: number;
	bet: number;
	allIn: boolean;
	folded: boolean;
	disconnected: boolean;
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
	currentPlayer: string;
}

interface GameEnded {
	winner: string;
	pot: number;
}

interface GamePlayersUpdate {
	players: Player[];
}

interface GameNextPlayer {
	nextPlayerID: string;
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

	gameStarted() {
		return this.socket.fromEvent<GameStarted>('server:game_started')
				   .pipe(takeUntil(this.unsubscribe$));
	}

	gameEnded() {
		return this.socket.fromEvent<GameEnded>('server:game_ended')
				   .pipe(takeUntil(this.unsubscribe$));
	}

	playersUpdate() {
		return this.socket.fromEvent<GamePlayersUpdate>('server:player_update');
	}

	nextPlayer(): Observable<string> {
		return this.socket.fromEvent<GameNextPlayer>('server:game:next_player')
				   .pipe(map(data => data.nextPlayerID));
	}


	/********************
	 * Game Actions
	 ********************/

	check() {
		this.socket.emit('player:check');
	}

	playerChecked() {
		return this.socket.fromEvent<PlayerChecked>('server:checked')
				   .pipe(
					   map(data => data),
					   takeUntil(this.unsubscribe$),
				   );
	}

	call() {
		this.socket.emit('player:call');
	}

	playerCalled() {
		return this.socket.fromEvent<PlayerCalled>('server:called')
				   .pipe(
					   map(data => data),
					   takeUntil(this.unsubscribe$),
				   );
	}

	bet(coins: number) {
		this.socket.emit('player:bet', coins);
	}

	playerBet() {
		return this.socket.fromEvent<PlayerBet>('server:bet')
				   .pipe(
					   map(data => data),
					   takeUntil(this.unsubscribe$),
				   );
	}

	fold() {
		this.socket.emit('player:fold');
	}

	playerFolded() {
		return this.socket.fromEvent<PlayerFolded>('server:folded')
				   .pipe(
					   map(data => data),
					   takeUntil(this.unsubscribe$),
				   );
	}

}
