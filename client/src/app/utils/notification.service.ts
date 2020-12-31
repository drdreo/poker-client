import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {

    private _action$ = new BehaviorSubject<string>('');
    action$ = this._action$.asObservable();

    constructor() {

    }

    showAction(message: string) {
        this._action$.next(message);
    }
}
