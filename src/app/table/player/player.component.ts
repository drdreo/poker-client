import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { PlayerOverview } from '@shared/src';

export type Player = PlayerOverview;

@Component({
    selector: 'poker-player',
    templateUrl: './player.component.html',
    styleUrls: ['./player.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerComponent {

    @Input() player: Player;
    @Input() playing = false;
    @Input() dealer = false;
    @Input() seat: number;

    constructor() { }

    bankValue(chips: number, allIn: boolean): string {
        return allIn ? 'All In' : chips + '€';
    }
}
