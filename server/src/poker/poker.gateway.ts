import { Logger, UseInterceptors } from '@nestjs/common';
import {
    ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse
} from '@nestjs/websockets';
import { Client, Server, Socket } from 'socket.io';
import {
    PokerEvent, GameStatus, GameRoundUpdate, GameBoardUpdate, GameDealerUpdate, GameCurrentPlayer, GameWinners, GamePotUpdate,
    GamePlayersUpdate, PlayerBet, HomeInfo, PlayerEvent, ServerJoined, PlayerChecked, PlayerCalled, PlayerFolded, MaxBetUpdate
} from '../../../shared/src';
import { SentryInterceptor } from '../sentry.interceptor';
import { Player } from './Player';
import { remapCards } from './table/Table';
import { TableService } from './table/table.service';
import { TableCommand, TableCommandName } from './table/TableCommand';

interface Connection {
    id: string;
    playerID: string | null;
}

@UseInterceptors(SentryInterceptor)
@WebSocketGateway()
export class PokerGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() server: Server;

    connections: Connection[] = [];

    private logger = new Logger(PokerGateway.name);


    constructor(private tableService: TableService) {

        this.tableService.tableCommands$
            .subscribe((cmd: TableCommand) => this.handleTableCommands(cmd));
    }

    private sendTo(room: string, event: PokerEvent, data?: any) {
        this.server.to(room).emit(event, data);
    }

    private sendToAll(event: PokerEvent, data?: any) {
        this.server.emit(event, data);
    }

    private getConnectionById(socketId: string): Connection {
        return this.connections.find(conn => conn.id === socketId);
    }

    handleConnection(socket: Client) {
        this.logger.debug(`A new client connected!`);

        this.connections.push({ id: socket.id, playerID: null });
    }

    handleDisconnect(socket: Client) {
        this.logger.debug(`A client disconnected!`);

        this.connections = this.connections.filter(conn => conn.id !== socket.id);

        this.handlePlayerDisconnect(socket['playerID'], socket['table']);
    }


    /**
     * Called when a socket disconnects or a player opens the home page (to tell the server that a player navigated away from the table)
     * @param playerID
     * @param table
     */
    private handlePlayerDisconnect(playerID: string | undefined, table: string | undefined) {

        if (playerID && this.tableService.playerExists(playerID)) {
            this.tableService.playerLeft(playerID);
            this.logger.debug(`Player[${ playerID }] left!`);

            if (table) {
                this.sendTo(table, PokerEvent.PlayerLeft, { playerID });
            } else {
                this.logger.error(`Player[${ playerID }] disconnected or left, but table[${ table }] no longer exists!`);
            }
        }
    }

    @SubscribeMessage(PlayerEvent.JoinRoom)
    onJoinRoom(@ConnectedSocket() socket: Socket, @MessageBody() { playerID, roomName, playerName }): WsResponse<ServerJoined> {
        this.logger.debug(`Player[${ playerName }] joining!`);

        const sanitized_room = roomName.toLowerCase();
        socket.join(sanitized_room);
        socket['table'] = sanitized_room;
        socket['playerID'] = playerID; // either overwrite existing one, reset it if its undefined

        let newPlayerID;

        // existing Player needs to reconnect
        if (playerID && this.tableService.playerExists(playerID)) {
            this.logger.debug(`Player[${ playerName }] needs to reconnect!`);
            newPlayerID = playerID;
            const table = this.tableService.playerReconnected(playerID);
            this.logger.debug(`Players last table[${table.name}] found!`);

            const gameStatus = table.getGameStatus();
            // tell the player again all information if game started: players, game status, board, pot
            if (gameStatus === GameStatus.Started) {
                table.sendCurrentPlayer();
                table.sendDealerUpdate();
                table.sendGameBoardUpdate();
                table.sendPotUpdate();
                table.sendMaxBetUpdate();
            }

            this.sendTo(socket.id, PokerEvent.GameStatus, gameStatus);

        } else if (playerName) {   // new Player wants to create or join
            const response = this.tableService.createOrJoinTable(sanitized_room, playerName);
            newPlayerID = response.playerID;

            this.sendHomeInfo();
        } else { // Spectator joining
            this.logger.debug(`Spectator joined!`);
        }

        // connect the socket with its playerID
        socket['playerID'] = newPlayerID;
        socket['table'] = sanitized_room;
        this.connections.find(conn => conn.id === socket.id).playerID = newPlayerID;


        this.tableService.getTable(sanitized_room).sendPlayersUpdate();
        return { event: PokerEvent.Joined, data: { playerID: newPlayerID, table: sanitized_room } };
    }

    @SubscribeMessage(PlayerEvent.StartGame)
    onStartGame(@ConnectedSocket() socket: Socket) {
        this.tableService.startGame(socket['table']);
        this.sendHomeInfo();
    }

    @SubscribeMessage(PlayerEvent.Leave)
    onPlayerLeave(@ConnectedSocket() socket: Socket) {
        this.handlePlayerDisconnect(socket['playerID'], socket['table']);
    }

    /**
     *
     * Game Actions
     */
    @SubscribeMessage(PlayerEvent.Check)
    onPlayerCheck(@ConnectedSocket() socket: Socket) {
        const playerID = socket['playerID'];
        const table = socket['table'];
        this.tableService.check(table, playerID);
        this.sendTo(table, PokerEvent.PlayerChecked, { playerID } as PlayerChecked);
    }

    @SubscribeMessage(PlayerEvent.Call)
    onPlayerCall(@ConnectedSocket() socket: Socket) {
        const playerID = socket['playerID'];
        const table = socket['table'];
        this.tableService.call(table, playerID);
        this.sendTo(table, PokerEvent.PlayerCalled, { playerID } as PlayerCalled);
    }

    @SubscribeMessage(PlayerEvent.Bet)
    onPlayerBet(@ConnectedSocket() socket: Socket, @MessageBody() coins: number) {
        const playerID = socket['playerID'];
        const table = socket['table'];
        this.tableService.bet(table, playerID, coins);
    }

    @SubscribeMessage(PlayerEvent.Fold)
    onPlayerFold(@ConnectedSocket() socket: Socket) {
        const playerID = socket['playerID'];
        const table = socket['table'];
        this.tableService.fold(table, playerID);
        this.sendTo(table, PokerEvent.PlayerFolded, { playerID } as PlayerFolded);
    }


    /**
     *    Table Actions
     */

    private handleTableCommands({ name, data, table }: TableCommand) {
        this.logger.verbose(`Table[${ table }] - ${ name }:`);
        this.logger.debug(data);

        switch (name) {

            case TableCommandName.HomeInfo:
                this.sendHomeInfo();
                break;

            case TableCommandName.GameStarted:
                this.sendTo(table, PokerEvent.GameStarted);
                break;

            case TableCommandName.PlayerUpdate:
                this.sendPlayerUpdateToSpectators(table);
                this.sendPlayerUpdateIndividually(table, data.players);
                break;

            case TableCommandName.PlayerBet: {
                let response: PlayerBet = { playerID: data.playerID, bet: data.bet, maxBet: data.maxBet, type: data.type };
                this.sendTo(table, PokerEvent.PlayerBet, response);
            }
                break;


            case TableCommandName.PlayersCards: {
                let response: GamePlayersUpdate = { players: data.players };
                this.sendTo(table, PokerEvent.PlayersCards, response);
            }
                break;

            case TableCommandName.PotUpdate: {
                let response: GamePotUpdate = { pot: data.pot, sidePots: data.sidePots };
                this.sendTo(table, PokerEvent.PotUpdate, response);
            }
                break;

            case TableCommandName.MaxBetUpdate: {
                let response: MaxBetUpdate = { maxBet: data.maxBet};
                this.sendTo(table, PokerEvent.MaxBetUpdate, response);
            }
                break;

            case TableCommandName.GameEnded:
                this.sendTo(table, PokerEvent.GameEnded);
                break;

            case TableCommandName.GameStatus:
                this.sendTo(table, PokerEvent.GameStatus, data.gameStatus as GameStatus);
                break;

            case TableCommandName.GameWinners: {
                let response: GameWinners = { winners: data.winners };
                this.sendTo(table, PokerEvent.GameWinners, response);
            }
                break;

            case TableCommandName.CurrentPlayer: {
                let response: GameCurrentPlayer = { currentPlayerID: data.currentPlayerID };
                this.sendTo(table, PokerEvent.CurrentPlayer, response);
            }
                break;

            case TableCommandName.Dealer: {
                let response: GameDealerUpdate = { dealerPlayerID: data.dealerPlayerID };
                this.sendTo(table, PokerEvent.DealerUpdate, response);
            }
                break;

            case TableCommandName.BoardUpdated: {
                let response: GameBoardUpdate = { board: data.board };
                this.sendTo(table, PokerEvent.BoardUpdate, response);
            }
                break;

            case TableCommandName.NewRound: {
                let response: GameRoundUpdate = { round: data.round };
                this.sendTo(table, PokerEvent.NewRound, response);
            }
                break;

            case TableCommandName.TableClosed :
                this.sendTo(table, PokerEvent.TableClosed);
                break;

            default:
                this.logger.warn(`Command[${ name }] was not handled!`);
                break;
        }
    }

    private sendPlayerUpdateIndividually(table: string, players: Player[]) {
        // tell every player the cards specifically
        for (let player of players) {

            const conn = this.connections.find(conn => conn.playerID === player.id);

            // only tell currently connected players the update
            if (conn && !player.disconnected) {
                const playersData = this.tableService.getTable(table).getPlayersPreview(); //TODO: for performance do not query each time

                // find the player in the data again and reveal cards
                playersData.find(p => p.id === player.id)['cards'] = remapCards(player.cards);

                this.sendTo(conn.id, PokerEvent.PlayersUpdate, { players: playersData } as GamePlayersUpdate);
            }
        }
    }

    private sendPlayerUpdateToSpectators(tableName: string) {
        const table = this.tableService.getTable(tableName);
        const playersData = table.getPlayersPreview();
        const room = this.server.sockets.adapter.rooms[tableName];

        for (let socketID in room.sockets) {
            const playerId = this.getConnectionById(socketID).playerID;
            const isPlayer = table.isPlayer(playerId);
            if (!isPlayer) {
                this.sendTo(tableName, PokerEvent.PlayersUpdate, { players: playersData } as GamePlayersUpdate);
            }
        }
    }

    private sendHomeInfo() {
        const response: HomeInfo = {
            tables: this.tableService.getAllTables(),
            players: this.tableService.getPlayersCount()
        };
        this.sendToAll(PokerEvent.HomeInfo, response);
    }
}
