import cors from 'cors';
import express from 'express';
import { PlayerEvent } from '../shared/src';

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    allowEIO3: true,
    cors: {
        origin: 'http://localhost:4200',
        methods: ['GET', 'POST'],
        credentials: true
    }
});


app.use(cors({
    origin: (origin, callback) => {
        callback(null, true);
    },
    allowedHeaders: 'X-Requested-With,X-HTTP-Method-Override,Content-Type,OPTIONS,Accept,Observe,sentry-trace',
    methods: 'GET,PUT,POST,DELETE,UPDATE,OPTIONS',
    credentials: true
}));


server.listen(3000, () =>
    console.log('Mock Server listening on port 3000!')
);


io.on('connection', socket => {
    console.log('Test Socket connection!');

    socket.on(PlayerEvent.JoinRoom, data => {
        socket.emit('server:joined', { playerID: 'd9016f23-a9b3-4c11-9517-407b01eddc75', table: data.roomName.toLowerCase() });
    });
});
