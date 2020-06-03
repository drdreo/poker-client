import { Injectable, OnDestroy } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { map, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface PlayerCheck {
	playerID: string;
}

interface PlayerCall {
	playerID: string;
}

interface PlayerFold {
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

@Injectable({
	providedIn: 'root',
})
export class PokerService implements OnDestroy {

	private unsubscribe$ = new Subject();

	constructor(private socket: Socket, private http: HttpClient) {
		this.gameStarted().subscribe(console.log);

		this.playerChecked().subscribe();
		this.playerCalled().subscribe();
		this.playerBet().subscribe();
		this.playerFold().subscribe();
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
		return this.socket.fromEvent<string>('server:joined')
				   .pipe(
					   takeUntil(this.unsubscribe$),
				   );
	}

	startGame() {
		this.socket.emit('startGame');
	}

	gameStarted() {
		return this.socket.fromEvent('server:game_started')
				   .pipe(
					   takeUntil(this.unsubscribe$),
				   );
	}

	/********************
	 * Game Actions
	 ********************/

	check() {
		this.socket.emit('player:check');
	}

	playerChecked() {
		return this.socket.fromEvent<PlayerCheck>('server:checked')
				   .pipe(
					   map(data => data),
					   takeUntil(this.unsubscribe$),
				   );
	}

	call() {
		this.socket.emit('player:call');
	}

	playerCalled() {
		return this.socket.fromEvent<PlayerCall>('server:called')
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

	playerFold() {
		return this.socket.fromEvent<PlayerFold>('server:folded')
				   .pipe(
					   map(data => data),
					   takeUntil(this.unsubscribe$),
				   );
	}

}
