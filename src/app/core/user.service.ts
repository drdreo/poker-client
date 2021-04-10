import { Injectable, OnDestroy } from '@angular/core';
import { SocialUser, SocialAuthService, GoogleLoginProvider } from 'angularx-social-login';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class UserService implements OnDestroy {

    private _user$ = new BehaviorSubject<SocialUser>(null);
    user$ = this._user$.asObservable();

    get user(): SocialUser {
        return this._user$.getValue();
    };

    get isLoggedIn(): boolean {
        return !!this.user;
    }

    private unsubscribe$ = new Subject();

    constructor(private authService: SocialAuthService) {
        this.authService.authState
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((user) => {
                this._user$.next(user);
            });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    signInWithGoogle(): void {
        this.authService.signIn(GoogleLoginProvider.PROVIDER_ID);
    }

    signOut(): void {
        this.authService.signOut();
    }
}
