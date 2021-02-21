import { Component, OnInit, Input } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SidePot } from '../../../../../shared/src';
import { Player } from '../player/player.component';

interface SidePotWithPlayers extends SidePot {
    players: Player[];
}

@Component({
    selector: 'table-infos',
    templateUrl: './table-infos.component.html',
    styleUrls: ['./table-infos.component.scss']
})
export class TableInfosComponent implements OnInit {

    @Input() tableName: string;
    @Input() players$: Observable<Player[]>;
    @Input() time$: Observable<number>;
    @Input() sidePots$: Observable<SidePot[]>;

    sidePotsWithPlayers$: Observable<SidePotWithPlayers[]>;

    constructor() {


    }

    ngOnInit(): void {
        this.sidePotsWithPlayers$ = combineLatest([this.players$, this.sidePots$])
            .pipe(
                tap(console.log),
                map(([players, sidePots]) => {
                    const newSidePots: SidePotWithPlayers[] = [];
                    sidePots.forEach(pot => {
                        const potPlayers = [];
                        pot.playerIDs.forEach(id => {
                            potPlayers.push(players.find(player => player.id === id));
                        });
                        newSidePots.push({ ...pot, players: potPlayers });
                    });
                    return newSidePots;
                }));
    }

}
