import { Component } from '@angular/core';
import { PokerService } from './poker.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent {
	title = 'client';

	constructor(private pokerService: PokerService) {}

	check() {
		this.pokerService.check();
	}

	create() {
		this.pokerService.create();
	}
}
