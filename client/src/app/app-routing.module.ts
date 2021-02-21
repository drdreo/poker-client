import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { ErrorComponent } from './error/error.component';
import { HomeComponent } from './home/home.component';


const routes: Routes = [
    {
        path: 'table',
        loadChildren: () => import('./table/table.module').then(m => m.TableModule)
    },
    { path: '', component: HomeComponent, pathMatch: 'full', data: { animation: 'HomePage' } },
    { path: '**', component: ErrorComponent }
];

// relativeLinkResolution: 'legacy',
@NgModule({
    imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
