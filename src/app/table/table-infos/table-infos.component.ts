import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { PokerService } from '../../poker.service';
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

    constructor(public pokerService: PokerService) {
    }

}
