import { Component, Input, OnInit } from '@angular/core';

interface Card {
	value: string;
	figure: string;
}

@Component({
	selector: 'app-card',
	templateUrl: './card.component.html',
	styleUrls: ['./card.component.scss'],
})
export class CardComponent implements Card, OnInit {

	@Input() value: string;
	@Input() figure: string;
	@Input() type: string;

	constructor() { }

	ngOnInit() {
	}

}
