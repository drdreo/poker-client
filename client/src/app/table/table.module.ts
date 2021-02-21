import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from './table.component';
import { TableRoutingModule } from './table-routing.module';
import { CardComponent } from './card/card.component';
import { PlayerComponent } from './player/player.component';
import { CoinsComponent } from './coins/coins.component';
import { FeedComponent } from './feed/feed.component';
import { FeedMessageComponent } from './feed/feed-message/feed-message.component';
import { TableInfosComponent } from './table-infos/table-infos.component';


@NgModule({
	declarations: [
		TableComponent,
		CardComponent,
		PlayerComponent,
		CoinsComponent,
		FeedComponent,
		FeedMessageComponent,
		TableInfosComponent,
	],
	imports: [
		CommonModule,
		TableRoutingModule,
	],
})
export class TableModule {
}
