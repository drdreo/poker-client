import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ErrorComponent } from './error/error.component';


const routes: Routes = [
	{
		path: 'table',
		loadChildren: () => import('./table/table.module').then(m => m.TableModule),
	},
	{path: '', component: HomeComponent, pathMatch: 'full'},
	{path: '**', component: ErrorComponent},
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
	exports: [RouterModule],
})
export class AppRoutingModule {
}
