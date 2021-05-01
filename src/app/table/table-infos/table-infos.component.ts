import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { DialogService } from '@ngneat/dialog';
import { Observable } from 'rxjs';
import { PokerService } from '../../poker.service';
import { GameService } from '../game.service';
import { HandRanksComponent } from '../hand-ranks/hand-ranks.component';
import { Player } from '../player/player.component';

@Component({
    selector: 'table-infos',
    templateUrl: './table-infos.component.html',
    styleUrls: ['./table-infos.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableInfosComponent {

    @Input() tableName: string;
    @Input() players$: Observable<Player[]>;
    @Input() time$: Observable<number>;

    constructor(private dialog: DialogService, public gameService: GameService) {
    }

    showPokerHandRanks() {
        this.dialog.open(HandRanksComponent);
    }
}
