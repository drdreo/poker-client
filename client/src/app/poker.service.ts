import { Injectable, OnDestroy } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class PokerService implements OnDestroy {


	private unsubscribe$ = new Subject();

	constructor(private socket: Socket) {
		this.socket.emit('handshake', 'tester');
		this.playerChecked().subscribe();
	}


	ngOnDestroy(): void {
		this.unsubscribe$.next();
		this.unsubscribe$.complete();
	}

	check() {
		this.socket.emit('check');
	}

	playerChecked() {
		return this.socket.fromEvent<string>('playerChecked')
				   .pipe(
					   map(data => data),
					   takeUntil(this.unsubscribe$),
				   );
	}


	create() {
		this.socket.emit('joinRoom', {playerName: 'Hackl', roomName: 'Hagenberg'});
	}
}
