import { Component, Input, OnInit } from '@angular/core';

export interface Card {
	value: number;
	figure: string;
}

@Component({
	selector: 'app-card',
	templateUrl: './card.component.html',
	styleUrls: ['./card.component.scss'],
})
export class CardComponent implements Card, OnInit {

	@Input() value: number;
	@Input() figure: string;

	constructor() { }

	ngOnInit() {
	}

}
