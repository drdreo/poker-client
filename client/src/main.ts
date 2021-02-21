import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from '@sentry/angular';
import { Integrations } from '@sentry/tracing';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

Sentry.init({
    dsn: 'https://8f134bc88a744cc28130a298f6bdae88@o528779.ingest.sentry.io/5646355',
    integrations: [
        new Integrations.BrowserTracing({
            tracingOrigins: ['localhost', 'https://pokern.herokuapp.com/api'],
            routingInstrumentation: Sentry.routingInstrumentation
        })
    ],
    release: "pokern@0.0.0",
    environment: environment.production ? 'production' : 'dev',
    tracesSampleRate: environment.production ? 0.2 : 1.0
});

if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
                        .catch(err => console.error(err));
