import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { TableModule } from './table/table.module';
import { HomeComponent } from './home/home.component';
import { ErrorComponent } from './error/error.component';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

const config: SocketIoConfig = {url: 'http://localhost:8988', options: {}};


@NgModule({
	declarations: [
		AppComponent,
		HomeComponent,
		ErrorComponent,
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		HttpClientModule,
		ReactiveFormsModule,
		SocketIoModule.forRoot(config),
		TableModule,
	],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {
}
