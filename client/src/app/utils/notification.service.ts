import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { MessageType, FeedMessage } from '../table/feed/feed-message/feed-message.component';

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

    private _newFeedMessage$ = new Subject<FeedMessage>();
    newFeedMessage$ = this._newFeedMessage$.asObservable();

    constructor(private socket: Socket) {
        this.socketError().subscribe((error) => {
            console.error(error);
        });
    }

    showAction(message: string) {
        this._action$.next(message);
    }

    clearAction(){
        this._action$.next('');
    }

    addFeedMessage(content: string, type?: MessageType) {
        this._newFeedMessage$.next({ content, type });
    }

    private socketError(): Observable<WsError> {
        return this.socket.fromEvent<WsError>('exception');
    }
}
