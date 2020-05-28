import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	WsResponse,
} from '@nestjs/websockets';
import { Client, Server, Socket } from 'socket.io';
import { TableService } from './table/table.service';

@WebSocketGateway(8988)
export class PokerGateway implements OnGatewayConnection, OnGatewayDisconnect {

	@WebSocketServer() server: Server;

	connections: number = 0;

	constructor(private tableService: TableService) {}

	async handleConnection(client: Client) {
		this.connections++;
	}

	async handleDisconnect() {
		this.connections--;
		this.server.emit('views', this.connections);
	}

	@SubscribeMessage('joinRoom')
	createRoom(@ConnectedSocket() socket: Socket, @MessageBody() {playerID, playerName, roomName}): WsResponse<unknown> {
		socket.join(roomName);
		let newPlayerID;

		if (playerID && this.tableService.playerExists(playerID)) {
			// todo: reconnect
		} else {
			newPlayerID = this.tableService.createOrJoinTable(roomName, playerName);
		}

		// connect the socket with its playerID
		socket["playerID"] = newPlayerID;
		socket["table"] = roomName;

		this.server.emit('playerJoined', playerName);
		return {event: 'joined', data: newPlayerID};
	}

	/**
	 *
	 * Game Actions
	 */
	@SubscribeMessage('check')
	handleCheck(@ConnectedSocket() socket: Socket) {
		this.tableService.check(socket["playerID"]);
		this.server.emit('playerChecked', 'tester');
	}

	@SubscribeMessage('call')
	handleCall(@ConnectedSocket() socket: Socket) {
		this.tableService.call(socket["playerID"]);
		this.server.emit('playerChecked', 'tester');
	}

	@SubscribeMessage('bet')
	handleBet(@ConnectedSocket() socket: Socket, @MessageBody() coins: number) {
		this.tableService.bet(socket["playerID"], coins);
		this.server.emit('playerChecked', 'tester');
	}

	@SubscribeMessage('fold')
	handleFold(@ConnectedSocket() socket: Socket) {
		this.tableService.fold(socket["playerID"]);
		this.server.emit('playerChecked', 'tester');
	}

}
