const domain = 'http://localhost:3000';

export const environment = {
    production: false,
    name: 'test',
    poker_api: domain + '/api/poker',
    admin_api: domain + '/api/admin',
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
