import { HttpClientModule } from '@angular/common/http';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { DialogModule } from '@ngneat/dialog';
import { TippyModule } from '@ngneat/helipopper';
import { HotToastModule } from '@ngneat/hot-toast';
import * as Sentry from '@sentry/angular';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';

import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ErrorHandlerModule } from './core/error/error-handler.module';
import { ErrorComponent } from './error/error.component';
import { HomeComponent } from './home/home.component';
import { PokerSettingsComponent } from './home/poker-settings/poker-settings.component';
import { SharedModule } from './shared/shared.module';
import { TableModule } from './table/table.module';

const config: SocketIoConfig = {
    url: environment.socket.url, options: environment.socket.config
};

@NgModule({
    declarations: [
        AppComponent,
        HomeComponent,
        ErrorComponent,
        PokerSettingsComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        HttpClientModule,
        ReactiveFormsModule,
        SocketIoModule.forRoot(config),
        ErrorHandlerModule,
        SharedModule,
        TableModule,
        DialogModule.forRoot(),
        TippyModule.forRoot({
            defaultVariation: 'tooltip',
            variations: {
                tooltip: {
                    theme: 'poker',
                    arrow: false,
                    animation: 'scale',
                    trigger: 'mouseenter',
                    offset: [0, 5]
                }
            }
        }),
        HotToastModule.forRoot()
    ],
    providers: [
        {
            provide: Sentry.TraceService,
            deps: [Router]
        },
        {
            provide: APP_INITIALIZER,
            useFactory: () => () => {},
            deps: [Sentry.TraceService],
            multi: true
        }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
