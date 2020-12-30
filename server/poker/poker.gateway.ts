import {
    ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse
} from '@nestjs/websockets';
import { Client, Server, Socket } from 'socket.io';
import { TableService } from './table/table.service';
import { Logger } from '@nestjs/common';
import { TableCommand } from './table/Table';

interface Connection {
    id: string;
    playerID: string | null;
}

@WebSocketGateway(8988)
export class PokerGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() server: Server;

    connections: Connection[] = [];

    constructor(private logger: Logger, private tableService: TableService) {
        this.logger.setContext('PokerGateway');

        this.tableService.tableCommands$
            .subscribe((cmd: TableCommand) => this.handleTableCommands(cmd));
    }

    private sendTo(room: string, event: string, data: any) {
        this.server.to(room).emit(event, data);
    }

    handleConnection(socket: Client) {
        this.logger.debug(`A new connection arrived!`);

        this.connections.push({ id: socket.id, playerID: null });
    }

    async handleDisconnect(socket: Client) {
        this.connections = this.connections.filter(conn => conn.id !== socket.id);
        if (socket['playerID']) {
            this.tableService.playerLeft(socket['playerID']);
            this.logger.debug(`Player[${ socket['playerID'] }] left!`);
        } else {
            this.logger.warn(`A stranger left!`);
        }
    }


    /**
     *    Table Actions
     */

    private handleTableCommands({ cmd, data, table }: TableCommand) {
        this.logger.verbose(`Table[${ table }] - ${ cmd }:`);
        console.dir(data);

        switch (cmd) {
            case 'game_started':
            case 'player_update':
                this.sendPlayerUpdate(table, data);
                break;

            case 'players_cards':
                this.sendTo(table, 'server:players_cards', { players: data.players });
                break;

            case 'game_ended':
                this.sendTo(table, 'server:game_ended', { winners: data.winners, pot: data.pot });
                break;

            case 'game:next_player':
                this.sendTo(table, 'server:game:next_player', { nextPlayerID: data.nextPlayerID });
                break;

            case 'game:board_updated':
                this.sendTo(table, 'server:game:board_updated', { board: data.board });
                break;

            default:
                this.logger.warn(`Command[${ cmd }] was not handled!`);
                break;
        }
    }

    sendPlayerUpdate(table, data) {
        // tell every player his / her cards specifically
        for (let player of data.players) {
            const conn = this.connections.find(conn => conn.playerID === player.id);
            const playersData = this.tableService.getTable(table).getPlayersPreview();
            // find the player in the data again and map the cards
            // also map the cards to the right client format {figure, value}
            playersData.find(p => p.id === player.id)['cards'] = player.cards.map(card => {
                const c = card.split('');
                // remap T to 10
                c[0] = c[0] === 'T' ? '10' : c[0];
                return { value: c[0], figure: c[1] };
            });

            this.sendTo(conn.id, 'server:player_update', { players: playersData });
        }
    }

    @SubscribeMessage('joinRoom')
    joinRoom(@ConnectedSocket() socket: Socket, @MessageBody() { playerID, playerName, roomName }): WsResponse<unknown> {
        socket.join(roomName);
        let newPlayerID;

        if (playerID && this.tableService.playerExists(playerID)) {
            // todo: reconnect
            this.logger.debug(`Player[${ playerID }] needs to reconnect!`);
            newPlayerID = playerID;
            this.tableService.playerReconnected(playerID);

        } else {
            const response = this.tableService.createOrJoinTable(roomName, playerName);
            newPlayerID = response.playerID;
        }

        // connect the socket with its playerID
        socket['playerID'] = newPlayerID;
        socket['table'] = roomName;
        this.connections.find(conn => conn.id === socket.id).playerID = newPlayerID;

        this.sendTo(roomName, 'server:player_update', { players: this.tableService.getTable(roomName).getPlayersPreview() });
        return { event: 'server:joined', data: { playerID: newPlayerID } };
    }

    @SubscribeMessage('startGame')
    startGame(@ConnectedSocket() socket: Socket) {
        this.tableService.startGame(socket['table']);
    }


    startRound() {
        // const players = this.tableService.startRound();
        // this.server.to().emit("server:round_started");
    }

    /**
     *
     * Game Actions
     */
    @SubscribeMessage('player:check')
    handleCheck(@ConnectedSocket() socket: Socket) {
        const playerID = socket['playerID'];
        const table = socket['table'];
        this.tableService.check(table, playerID);
        this.sendTo(table, 'server:checked', playerID);
    }

    @SubscribeMessage('player:call')
    handleCall(@ConnectedSocket() socket: Socket) {
        const playerID = socket['playerID'];
        const table = socket['table'];
        this.tableService.call(table, playerID);
        this.sendTo(table, 'server:called', playerID);
    }

    @SubscribeMessage('player:bet')
    handleBet(@ConnectedSocket() socket: Socket, @MessageBody() coins: number) {
        const playerID = socket['playerID'];
        const table = socket['table'];
        this.tableService.bet(table, playerID, coins);
        this.sendTo(table, 'server:bet', playerID);
    }

    @SubscribeMessage('player:fold')
    handleFold(@ConnectedSocket() socket: Socket) {
        const playerID = socket['playerID'];
        const table = socket['table'];
        this.tableService.fold(table, playerID);
        this.sendTo(table, 'server:folded', playerID);
    }

}
