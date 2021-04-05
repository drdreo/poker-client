import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DialogService } from '@ngneat/dialog';
import { HotToastService } from '@ngneat/hot-toast';
import * as Sentry from '@sentry/angular';
import { HomeInfo } from '@shared/src';
import { Observable, Subject, merge, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PokerService } from '../poker.service';
import { ErrorService } from '../shared/error.service';
import { PokerSettingsComponent } from './poker-settings/poker-settings.component';

@Sentry.TraceClassDecorator()
@Component({
    selector: 'poker-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnDestroy {
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

    private config: any;

    get username() {
        return this.loginForm.get('username');
    }

    get table() {
        return this.loginForm.get('table');
    }

    isJoinable = true;

    private unsubscribe$ = new Subject();

    constructor(
        private router: Router,
        private errorService: ErrorService,
        private pokerService: PokerService,
        private dialog: DialogService,
        private toastService: HotToastService) {

        this.pokerService.leave(); // try to leave if a player comes from a table

        this.connectionError$ = this.errorService.socketConnectionError$;

        this.errorService.socketError$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(error => {
                this.toastService.error(error.message, { id: 'error' });
            });

        this.homeInfo$ = merge(this.pokerService.loadHomeInfo(), this.pokerService.homeInfo());

        this.pokerService.roomJoined()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(({ playerID, table }) => {
                localStorage.setItem('playerID', playerID);
                this.router.navigate(['/table', table]);
            });

        combineLatest([this.table.valueChanges, this.homeInfo$])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([tableName, homeInfo]) => {
                const table = homeInfo.tables.find(t => t.name === tableName);

                if (table && table.started) {
                    this.isJoinable = false;
                } else {
                    this.isJoinable = true;
                }
            });
    }

    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    onTableClick(tableName: string) {
        this.table.patchValue(tableName);
    }

    joinTable() {
        if (this.loginForm.valid) {
            const username = this.username.value;
            const table = this.table.value;
            this.pokerService.createOrJoinRoom(table, username, this.config);
        }
    }

    spectateTable() {
        const table = this.table.value;
        this.pokerService.joinAsSpectator(table);
    }

    generateRoomName(e): void {
        const randomName = Math.random().toString(36).substring(8);

        this.table.patchValue(randomName);
    }

    openSettings() {
        this.dialog.open(PokerSettingsComponent)
            .afterClosed$
            .subscribe((config: any) => {
                console.log(`Settings closed`);
                console.log(config);
                this.config = config;
            });
    }
}

function tableNameValidator(nameRe: RegExp): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        const allowed = nameRe.test(control.value);
        return allowed ? null : { forbiddenName: { value: control.value } };
    };
}
