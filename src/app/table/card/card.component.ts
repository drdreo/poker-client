import { Component, Input, OnInit } from '@angular/core';

interface Card {
	value: string;
	figure: string;
}

@Component({
	selector: 'poker-card',
	templateUrl: './card.component.html',
	styleUrls: ['./card.component.scss'],
})
export class CardComponent implements Card, OnInit {

	@Input() value: string;
	@Input() figure: string;

	constructor() { }

	ngOnInit() {
	}

}
