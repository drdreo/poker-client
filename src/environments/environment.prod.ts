const domain = 'https://pokern.herokuapp.com';
const domain_ws = 'wss://pokern.herokuapp.com';

export const environment = {
    production: true,
    name: 'production',
    poker_api: domain + '/api/poker',
    socket: {
        url: domain_ws,
        config: {}
    },
    sentry: {
        dsn: 'https://8f134bc88a744cc28130a298f6bdae88@o528779.ingest.sentry.io/5646355',
        tracingOrigins: ['https://pokern.herokuapp.com/api'],
        tracesSampleRate: 0.2,
        enabled: true
    }
};
