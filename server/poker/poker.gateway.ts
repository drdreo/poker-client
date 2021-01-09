import { Logger } from '@nestjs/common';
import {
    ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse
} from '@nestjs/websockets';
import { Client, Server, Socket } from 'socket.io';
import { TableCommand, remapCards } from './table/Table';
import { TableService } from './table/table.service';

interface Connection {
    id: string;
    playerID: string | null;
}

const port: number = +process.env.PORT;

@WebSocketGateway(port)
export class PokerGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() server: Server;

    connections: Connection[] = [];

    constructor(private logger: Logger, private tableService: TableService) {
        this.logger.setContext('PokerGateway');

        this.tableService.tableCommands$
            .subscribe((cmd: TableCommand) => this.handleTableCommands(cmd));
    }

    private sendTo(room: string, event: string, data?: any) {
        this.server.to(room).emit(event, data);
    }

    handleConnection(socket: Client) {
        this.logger.debug(`A new connection arrived!`);

        this.connections.push({ id: socket.id, playerID: null });
    }

    async handleDisconnect(socket: Client) {
        this.connections = this.connections.filter(conn => conn.id !== socket.id);

        this.handlePlayerDisconnect(socket['playerID'], socket['table']);
    }


    private handlePlayerDisconnect(playerID: string, table: string) {

        if (playerID && this.tableService.playerExists(playerID)) {
            this.tableService.playerLeft(playerID);
            this.logger.debug(`Player[${ playerID }] left!`);

            this.sendTo(table, 'server:player:left', { playerID });
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
                this.sendTo(table, 'server:game:started');
                this.sendPlayerUpdate(table, data.players);
                break;

            case 'player_update':
                this.sendPlayerUpdate(table, data.players);
                break;

            case 'players_cards':
                this.sendTo(table, 'server:players_cards', { players: data.players });
                break;

            case 'pot_update':
                this.sendTo(table, 'server:pot_update', { pot: data.pot });
                break;

            case 'game_ended':
                this.sendTo(table, 'server:game:ended');
                break;

            case 'game_winners':
                this.sendTo(table, 'server:game:winners', { winners: data.winners, pot: data.pot });
                break;

            case 'current_player':
                this.sendTo(table, 'server:game:current_player', { currentPlayerID: data.currentPlayerID });
                break;

            case 'board_updated':
                this.sendTo(table, 'server:game:board_updated', { board: data.board });
                break;

            default:
                this.logger.warn(`Command[${ cmd }] was not handled!`);
                break;
        }
    }

    sendPlayerUpdate(table: string, players) {

        // tell every player the cards specifically
        for (let player of players) {
            // only tell currently connected players the update
            if (!player.disconnected) {
                const playersData = this.tableService.getTable(table).getPlayersPreview(); //TODO: for performance do not query each time

                const conn = this.connections.find(conn => conn.playerID === player.id);
                // find the player in the data again and reveal cards
                playersData.find(p => p.id === player.id)['cards'] = remapCards(player.cards);

                this.sendTo(conn.id, 'server:players_update', { players: playersData });
            }
        }
    }

    @SubscribeMessage('joinRoom')
    joinRoom(@ConnectedSocket() socket: Socket, @MessageBody() { playerID, roomName, playerName }): WsResponse<unknown> {
        socket.join(roomName);
        let newPlayerID;

        if (playerID && this.tableService.playerExists(playerID)) {
            this.logger.debug(`Player[${ playerID }] needs to reconnect!`);
            newPlayerID = playerID;
            this.tableService.playerReconnected(playerID);

            // tell the player again all information: players, game status, board, pot
            const table = this.tableService.getTable(roomName);
            table.sendCurrentPlayer();
            table.sendGameBoardUpdate();
            table.sendPotUpdate();

            const gameStatus = table.getGameStatus();
            this.sendTo(socket.id, 'server:game:status', gameStatus);


        } else if (playerName) {
            const response = this.tableService.createOrJoinTable(roomName, playerName);
            newPlayerID = response.playerID;
        } else {
            this.logger.debug(`Spectator joined!`);
        }

        // connect the socket with its playerID
        socket['playerID'] = newPlayerID;
        socket['table'] = roomName;
        this.connections.find(conn => conn.id === socket.id).playerID = newPlayerID;


        this.tableService.getTable(roomName).sendPlayersUpdate();
        return { event: 'server:joined', data: { playerID: newPlayerID } };
    }

    @SubscribeMessage('startGame')
    startGame(@ConnectedSocket() socket: Socket) {
        this.tableService.startGame(socket['table']);
    }


    @SubscribeMessage('player:leave')
    handleLeave(@ConnectedSocket() socket: Socket) {
        this.handlePlayerDisconnect(socket['playerID'], socket['table']);
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
        this.sendTo(table, 'server:checked', { playerID });
    }

    @SubscribeMessage('player:call')
    handleCall(@ConnectedSocket() socket: Socket) {
        const playerID = socket['playerID'];
        const table = socket['table'];
        this.tableService.call(table, playerID);
        this.sendTo(table, 'server:called', { playerID });
    }

    @SubscribeMessage('player:bet')
    handleBet(@ConnectedSocket() socket: Socket, @MessageBody() coins: number) {
        const playerID = socket['playerID'];
        const table = socket['table'];
        this.tableService.bet(table, playerID, coins);
        this.sendTo(table, 'server:bet', { playerID, coins });
    }

    @SubscribeMessage('player:fold')
    handleFold(@ConnectedSocket() socket: Socket) {
        const playerID = socket['playerID'];
        const table = socket['table'];
        this.tableService.fold(table, playerID);
        this.sendTo(table, 'server:folded', { playerID });
    }

}
