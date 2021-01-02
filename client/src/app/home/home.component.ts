import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HomeInfo, PokerService } from '../poker.service';
import { Observable, Subject } from 'rxjs';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
	homeInfo$: Observable<HomeInfo>;

	loginForm = new FormGroup({
		username: new FormControl('', {
			updateOn: 'blur',
			validators: [
				Validators.required,
				Validators.minLength(4)],
		}),
		table: new FormControl('', {
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

	private unsubscribe$ = new Subject();

	constructor(private router: Router, private pokerService: PokerService) {
		this.homeInfo$ = this.pokerService.fetchHomeInfo();

		this.pokerService.roomJoined()
			.pipe(takeUntil(this.unsubscribe$))
			.subscribe(({playerID}) => {
				localStorage.setItem('playerID', playerID);
				this.router.navigate(['/table', this.table.value]);
			});
	}

	onTableClick(tableName: string) {
		this.table.patchValue(tableName);
	}

	joinTable() {
		if (this.loginForm.valid) {
			console.log('Joining Room');
			const username = this.username.value;
			const table = this.table.value;
			this.pokerService.createOrJoinRoom(table, username);
		}
	}
}

function tableNameValidator(nameRe: RegExp): ValidatorFn {
	return (control: AbstractControl): { [key: string]: any } | null => {
		const allowed = nameRe.test(control.value);
		return allowed ? null : {'forbiddenName': {value: control.value}};
	};
}
