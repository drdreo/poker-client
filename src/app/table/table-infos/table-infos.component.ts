import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { SidePot } from '@shared/src';
import { Player } from '../player/player.component';

@Component({
    selector: 'table-infos',
    templateUrl: './table-infos.component.html',
    styleUrls: ['./table-infos.component.scss']
})
export class TableInfosComponent {

    @Input() tableName: string;
    @Input() players$: Observable<Player[]>;
    @Input() time$: Observable<number>;

    constructor() {
    }

}
