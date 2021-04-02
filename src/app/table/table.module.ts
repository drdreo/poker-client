import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { CardComponent } from './card/card.component';
import { ChipsComponent } from './chips/chips.component';
import { FeedMessageComponent } from './feed/feed-message/feed-message.component';
import { FeedComponent } from './feed/feed.component';
import { GameControlsComponent } from './game-controls/game-controls.component';
import { PlayerComponent } from './player/player.component';
import { SidepotComponent } from './sidepots/sidepot/sidepot.component';
import { SidepotsComponent } from './sidepots/sidepots.component';
import { TableInfosComponent } from './table-infos/table-infos.component';
import { TableRoutingModule } from './table-routing.module';
import { TableComponent } from './table.component';
import { HandRanksComponent } from './hand-ranks/hand-ranks.component';


@NgModule({
    declarations: [
        TableComponent,
        CardComponent,
        PlayerComponent,
        ChipsComponent,
        FeedComponent,
        FeedMessageComponent,
        TableInfosComponent,
        GameControlsComponent,
        SidepotsComponent,
        SidepotComponent,
        HandRanksComponent
    ],
    imports: [
        CommonModule,
        TableRoutingModule,
        SharedModule
    ]
})
export class TableModule {
}
