import { Logger } from '@nestjs/common';
import {
    ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse
} from '@nestjs/websockets';
import { Client, Server, Socket } from 'socket.io';
import { Player } from './Player';
import { TableCommand, remapCards, GameStatus } from './table/Table';
import { TableService } from './table/table.service';

interface Connection {
    id: string;
    playerID: string | null;
}

@WebSocketGateway()
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

    private sendToAll(event, data?: any) {
        this.server.emit(event, data);
    }

    private getConnectionById(socketId: string): Connection {
        return this.connections.find(conn => conn.id === socketId);
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

            case 'home_info':
                this.sendHomeInfo();
                break;

            case 'game_started':
                this.sendTo(table, 'server:game:started');
                break;

            case 'player_update':
                this.sendPlayerUpdateToSpectators(table, data.players);
                this.sendPlayerUpdateIndividually(table, data.players);
                break;

            case 'player_bet':
                this.sendTo(table, 'server:bet', { playerID: data.playerID, bet: data.bet, type: data.type });
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

            case 'game_status':
                this.sendTo(table, 'server:game:status', data.gameStatus);
                break;

            case 'game_winners':
                this.sendTo(table, 'server:game:winners', { winners: data.winners, pot: data.pot });
                break;

            case 'current_player':
                this.sendTo(table, 'server:game:current_player', { currentPlayerID: data.currentPlayerID });
                break;

            case 'dealer':
                this.sendTo(table, 'server:game:dealer', { dealerPlayerID: data.dealerPlayerID });
                break;

            case 'board_updated':
                this.sendTo(table, 'server:game:board_updated', { board: data.board });
                break;

            case 'new_round':
                this.sendTo(table, 'server:game:new_round', { round: data.round });
                break;

            case 'table_closed':
                this.sendTo(table, 'server:table:closed');
                break;

            default:
                this.logger.warn(`Command[${ cmd }] was not handled!`);
                break;
        }
    }

    sendPlayerUpdateIndividually(table: string, players: Player[]) {
        // tell every player the cards specifically
        for (let player of players) {

            const conn = this.connections.find(conn => conn.playerID === player.id);

            // only tell currently connected players the update
            if (conn && !player.disconnected) {
                const playersData = this.tableService.getTable(table).getPlayersPreview(); //TODO: for performance do not query each time

                // find the player in the data again and reveal cards
                playersData.find(p => p.id === player.id)['cards'] = remapCards(player.cards);

                this.sendTo(conn.id, 'server:players_update', { players: playersData });
            }
        }
    }

    sendPlayerUpdateToSpectators(tableName: string, players: Player[]) {
        const table = this.tableService.getTable(tableName);
        const playersData = table.getPlayersPreview();
        const room = this.server.sockets.adapter.rooms[tableName];

        for (let socketID in room.sockets) {
            const playerId = this.getConnectionById(socketID).playerID;
            const isPlayer = table.isPlayer(playerId);
            if (!isPlayer) {
                this.sendTo(tableName, 'server:players_update', { players: playersData });
            }
        }
    }


    sendHomeInfo() {
        this.sendToAll('server:home:info', {
            tables: this.tableService.getAllTables(),
            players: this.tableService.getPlayersCount()
        });
    }

    @SubscribeMessage('joinRoom')
    joinRoom(@ConnectedSocket() socket: Socket, @MessageBody() { playerID, roomName, playerName }): WsResponse<unknown> {
        socket.join(roomName);
        let newPlayerID;

        if (playerID && this.tableService.playerExists(playerID)) {
            this.logger.debug(`Player[${ playerID }] needs to reconnect!`);
            newPlayerID = playerID;
            this.tableService.playerReconnected(playerID);

            const table = this.tableService.getTable(roomName);
            const gameStatus = table.getGameStatus();
            // tell the player again all information if game started: players, game status, board, pot
            if (gameStatus === GameStatus.Started) {
                table.sendCurrentPlayer();
                table.sendGameBoardUpdate();
                table.sendPotUpdate();
            }

            this.sendTo(socket.id, 'server:game:status', gameStatus);


        } else if (playerName) {
            const response = this.tableService.createOrJoinTable(roomName, playerName);
            newPlayerID = response.playerID;

            this.sendHomeInfo();
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
        this.sendHomeInfo();
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
        // this.sendTo(table, 'server:bet', { playerID, coins });
    }

    @SubscribeMessage('player:fold')
    handleFold(@ConnectedSocket() socket: Socket) {
        const playerID = socket['playerID'];
        const table = socket['table'];
        this.tableService.fold(table, playerID);
        this.sendTo(table, 'server:folded', { playerID });
    }

}
