import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableComponent } from './table.component';
import { TableRoutingModule } from './table-routing.module';
import { CardComponent } from './card/card.component';
import { PlayerComponent } from './player/player.component';
import { CoinsComponent } from './coins/coins.component';
import { ControlsComponent } from './controls/controls.component';


@NgModule({
	declarations: [
		TableComponent,
		CardComponent,
		PlayerComponent,
		CoinsComponent,
		ControlsComponent,
	],
	imports: [
		CommonModule,
		TableRoutingModule,
	],
})
export class TableModule {
}
