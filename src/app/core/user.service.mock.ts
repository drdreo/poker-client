import { Injectable } from '@angular/core';
import { SocialUser } from 'angularx-social-login';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class UserServiceMock {

    private _user$ = new BehaviorSubject<SocialUser>(null);
    user$ = this._user$.asObservable();

    get user(): SocialUser {
        return this._user$.getValue();
    };

    get isLoggedIn(): boolean {
        return false;
    }

    constructor() { }


    signInWithGoogle(): void {
    }

    signOut(): void {
    }
}
