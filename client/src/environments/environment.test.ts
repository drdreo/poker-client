
export const environment = {
	production: false,
	name: 'test',
	poker_api: 'http://localhost:3000/api/poker',
	socket_url: 'ws://localhost:3000',
	sentry: {
		dsn: '',
		tracingOrigins: undefined,
		tracesSampleRate : 0,
		enabled: false
	}
};
