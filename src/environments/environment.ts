// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
	production: false,
	name: 'dev',
	poker_api: 'http://localhost:3000/api/poker',
	socket: {
		url: 'ws://localhost:3000',
		config: {
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			reconnectionAttempts: 5
		}
	},
	sentry: {
		dsn: 'https://8f134bc88a744cc28130a298f6bdae88@o528779.ingest.sentry.io/5646355',
		tracingOrigins: ['localhost:4200'],
		tracesSampleRate: 1.0,
		enabled: false
	}
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
