import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Card } from '../card/card.component';

export interface Player {
    id: string;
    name: string;
    chips: number;
    bet?: number;
    color: string;
    cards?: Card[];
    allIn: boolean;
    folded: boolean;
    disconnected: boolean;
}

@Component({
    selector: 'app-player',
    templateUrl: './player.component.html',
    styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnChanges {

    @Input() player: Player;
    @Input() playing: boolean = false;
    @Input() dealer: boolean = false;
    @Input() index;

    constructor() { }

    ngOnChanges(changes: SimpleChanges) {

    }

    getArray(number: number) {
        return Array(number).fill(0).map((x, i) => i);
    }
}
