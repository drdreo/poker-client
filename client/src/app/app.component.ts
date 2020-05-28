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


	create() {
		this.pokerService.createOrJoinRoom();
	}

	startGame() {
		this.pokerService.startGame();
	}

	check() {
		this.pokerService.check();
	}

	call() {
		this.pokerService.call();
	}

	bet() {
		this.pokerService.bet(100);
	}

	fold() {
		this.pokerService.fold();
	}

}
