import { Injectable, OnDestroy } from '@angular/core';
import { DialogService } from '@ngneat/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MessageType, FeedMessage } from '../table/feed/feed-message/feed-message.component';
import { ConnectionErrorComponent } from './connection-error/connection-error.component';
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
export class NotificationService implements OnDestroy {

    private _action$ = new Subject<Action>();
    action$ = this._action$.asObservable();

    private _newFeedMessage$ = new Subject<FeedMessage>();
    newFeedMessage$ = this._newFeedMessage$.asObservable();

    private errorDialogRef;

    private unsubscribe$ = new Subject();

    constructor(private error: ErrorService, private dialog: DialogService) {

        this.error.socketConnectionError$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(e => {
                if (e) {
                    if (!this.errorDialogRef) {
                        this.errorDialogRef = this.dialog.open(ConnectionErrorComponent, {
                            enableClose: false,
                            minHeight: 'unset',
                            data: {
                                error: e
                            }
                        });
                    }
                } else {
                    if (this.errorDialogRef) {
                        this.errorDialogRef.close();
                        this.errorDialogRef = undefined;
                    }
                }

            });

        this.error.socketError$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(e => {
                this.showAction(e.message, 'error');
            });
    }


    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
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

    showFatalError(content: string) {

    }

}
