import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { WsError } from './notification.service';

export class ConnectionError extends Error {
    name = 'Connection Error';
}

@Injectable({
    providedIn: 'root'
})
export class ErrorService {

    private _socketConnectionError$ = new BehaviorSubject(null);
    socketConnectionError$ = this._socketConnectionError$.asObservable();

    private _socketError$ = new Subject<WsError>();
    socketError$: Observable<WsError> = this._socketError$.asObservable();

    private unsubscribe$ = new Subject();

    constructor(private socket: Socket) {
        this.connectionEstablished()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this._socketConnectionError$.next(null);
            });

        this.connectionError()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(error => {
                const e = new ConnectionError(error.message);
                console.error('Socket Connection Error: ', e);
                this._socketConnectionError$.next(e);
            });

        this.socketError()
            .pipe(
                tap(console.error),
                takeUntil(this.unsubscribe$)
            ).subscribe((error) => {
            this._socketError$.next(error);
        });
    }

    private connectionEstablished(): Observable<any> {
        return this.socket.fromEvent('connect');
    }

    private connectionError(): Observable<any> {
        return this.socket.fromEvent('connect_error');
    }

    private socketError(): Observable<WsError> {
        return this.socket.fromEvent<WsError>('exception');
    }
}
