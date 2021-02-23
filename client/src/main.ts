import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from '@sentry/angular';
import { Integrations } from '@sentry/tracing';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

console.log('Initiating Sentry...');

Sentry.init({
    dsn: environment.sentry.dsn,
    integrations: [
        new Integrations.BrowserTracing({
            tracingOrigins: environment.sentry.tracingOrigins,
            routingInstrumentation: Sentry.routingInstrumentation
        })
    ],
    release: 'pokern@0.0.0',
    environment: environment.production ? 'production' : 'dev',
    tracesSampleRate: environment.sentry.tracesSampleRate,
});


if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
                        .catch(err => console.error(err));
