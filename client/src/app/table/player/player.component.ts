import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { PlayerOverview } from '../../../../../shared/src';

export type Player = PlayerOverview;

@Component({
    selector: 'app-player',
    templateUrl: './player.component.html',
    styleUrls: ['./player.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerComponent {

    @Input() player: Player;
    @Input() playing: boolean = false;
    @Input() dealer: boolean = false;
    @Input() seat: number;

    constructor() { }

    bankValue(chips: number, allIn: boolean): string {
        return allIn ? 'All In' : chips + '€';
    }
}
