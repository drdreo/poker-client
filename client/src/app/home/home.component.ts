import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { HomeInfo, PokerService, PokerTable } from '../poker.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnDestroy {
	totalPlayers: number = 0;
	tables: PokerTable[];
	homeInfo$: Observable<HomeInfo>;

	loginForm = new FormGroup({
		username: new FormControl('', {
			updateOn: 'change',
			validators: [
				Validators.required,
				Validators.minLength(4)],
		}),
		table: new FormControl('', {
			updateOn: 'change',
			validators: [
				Validators.required,
				tableNameValidator(/^\w+$/i)],
		}),
	});

	get username() {
		return this.loginForm.get('username');
	}

	get table() {
		return this.loginForm.get('table');
	}

	unsubscribe$ = new Subject();


	constructor(private router: Router, private pokerService: PokerService) {
		this.homeInfo$ = this.pokerService.fetchHomeInfo()
							 .pipe(takeUntil(this.unsubscribe$));
		// .subscribe((res) => {
		// 	this.tables = res.tables;
		// 	this.totalPlayers = res.players;
		// });

		this.pokerService.roomJoined()
			.subscribe(playerID => {
				localStorage.setItem('playerID', playerID);
				this.router.navigate(['/table', this.table.value]);
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
			console.log('Joining Room');
			const username = this.username.value;
			const table = this.table.value;
			this.pokerService.createOrJoinRoom(username, table);
		}
	}
}

function tableNameValidator(nameRe: RegExp): ValidatorFn {
	return (control: AbstractControl): { [key: string]: any } | null => {
		const allowed = nameRe.test(control.value);
		return allowed ? null : {'forbiddenName': {value: control.value}};
	};
}
