import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Socket } from 'ngx-socket-io';

export interface WsError {
    message: string;
    status: 'error';
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private _action$ = new BehaviorSubject<string>('');
    action$ = this._action$.asObservable();

    constructor(private socket: Socket) {

        this.socketError().subscribe((error) => {
            console.error(error);
        });
    }

    showAction(message: string) {
        this._action$.next(message);
    }


    private socketError(): Observable<WsError> {
        return this.socket.fromEvent<WsError>('exception');
    }
}
