export const environment = {
    production: false,
    name: 'test',
    poker_api: 'http://localhost:3000/api/poker',
    socket: {
        url: 'ws://localhost:3000',
        config: {}
    },
    sentry: {
        dsn: '',
        tracingOrigins: undefined,
        tracesSampleRate: 0,
        enabled: false
    }
};
