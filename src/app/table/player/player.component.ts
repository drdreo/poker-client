import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter  } from '@angular/core';
import { PlayerOverview } from '@shared/src';
import { PokerService } from '../../poker.service';

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
    @Output() voteKick: EventEmitter<void> = new EventEmitter();

    constructor() { }

    bankValue(chips: number, allIn: boolean): string {
        return allIn ? 'All In' : chips + '€';
    }

    kick() {
        if (this.player.afk) {
            console.log('Vote Kick!');
            this.voteKick.emit();
        }
    }
}
