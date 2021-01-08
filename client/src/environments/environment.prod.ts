const domain = 'https://pokern.herokuapp.com';
const domain_ws = 'wss://pokern.herokuapp.com';

export const environment = {
    production: true,
    poker_api: domain + '/api/poker',
    socket_url: domain_ws
};
