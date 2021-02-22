import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as Sentry from '@sentry/angular';
import { Integrations } from '@sentry/tracing';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

setTimeout(() => {
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
        tracesSampleRate: environment.production ? 0.2 : 1.0
    });
}, 2000);

if (environment.production) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
                        .catch(err => console.error(err));
