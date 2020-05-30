import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TableComponent } from './table.component';


const routes: Routes = [
	{
		path: ':tableName',
		component: TableComponent,
	},
	{path: '', redirectTo: '/', pathMatch: 'full'},
	{path: '**', redirectTo: ''},

];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class TableRoutingModule {
}
