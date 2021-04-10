import { Component, ChangeDetectionStrategy } from '@angular/core';
import { UserService } from '../../core/user.service';

@Component({
    selector: 'poker-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {

    constructor(public userService: UserService) { }

    login() {
        this.userService.signInWithGoogle();
    }
}
