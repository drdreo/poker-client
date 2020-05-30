import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from './table.component';
import { TableRoutingModule } from './table-routing.module';
import { CardComponent } from './card/card.component';
import { PlayerComponent } from './player/player.component';


@NgModule({
	declarations: [
		TableComponent,
		CardComponent,
		PlayerComponent,
	],
	imports: [
		CommonModule,
		TableRoutingModule,
	],
})
export class TableModule {
}
