import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { MessageType, FeedMessage } from '../table/feed/feed-message/feed-message.component';
import { ErrorService } from './error.service';

export interface WsError {
    message: string;
    status: 'error';
}


export interface Action {
    message: string;
    status: 'info' | 'error';
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private _action$ = new BehaviorSubject<Action>(null);
    action$ = this._action$.asObservable();

    private _newFeedMessage$ = new Subject<FeedMessage>();
    newFeedMessage$ = this._newFeedMessage$.asObservable();

    constructor(private error: ErrorService) {
        this.error.socketError$
            .subscribe(e => {
                this.showAction(e.message, 'error');
            });
    }

    showAction(message: string, status: 'info' | 'error' = 'info') {
        this._action$.next({ message, status });
    }

    clearAction() {
        this._action$.next(null);
    }

    addFeedMessage(content: string, type?: MessageType) {
        this._newFeedMessage$.next({ content, type });
    }
}
