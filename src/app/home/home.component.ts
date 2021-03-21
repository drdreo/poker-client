import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import * as Sentry from '@sentry/angular';
import { HomeInfo } from '@shared/src';
import { Observable, Subject, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PokerService } from '../poker.service';
import { ErrorService } from '../shared/error.service';

@Sentry.TraceClassDecorator()
@Component({
    selector: 'poker-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
    homeInfo$: Observable<HomeInfo>;

    connectionError$: Observable<any>;

    loginForm = new FormGroup({
        username: new FormControl('', {
            updateOn: 'blur',
            validators: [
                Validators.required,
                Validators.minLength(4)]
        }),
        table: new FormControl('', {
            validators: [
                Validators.required,
                tableNameValidator(/^\w+$/i)]
        })
    });

    get username() {
        return this.loginForm.get('username');
    }

    get table() {
        return this.loginForm.get('table');
    }

    private unsubscribe$ = new Subject();

    constructor(private router: Router, private error: ErrorService, private pokerService: PokerService) {

        this.pokerService.leave(); // try to leave if a player comes from a table

        this.connectionError$ = this.error.socketConnectionError$;

        this.homeInfo$ = merge(this.pokerService.loadHomeInfo(), this.pokerService.homeInfo());

        this.pokerService.roomJoined()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(({ playerID, table }) => {
                localStorage.setItem('playerID', playerID);
                this.router.navigate(['/table', table]);
            });
    }

    onTableClick(tableName: string) {
        this.table.patchValue(tableName);
    }

    joinTable() {
        if (this.loginForm.valid) {
            const username = this.username.value;
            const table = this.table.value;
            this.pokerService.createOrJoinRoom(table, username);
        }
    }

    generateRoomName(e): void {
        const randomName = Math.random().toString(36).substring(8);

        this.table.patchValue(randomName);
    }
}

function tableNameValidator(nameRe: RegExp): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        const allowed = nameRe.test(control.value);
        return allowed ? null : { forbiddenName: { value: control.value } };
    };
}
