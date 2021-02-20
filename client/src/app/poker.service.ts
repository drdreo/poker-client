import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
    PokerEvent, GameStatus, TableResponse, HomeInfo, ServerJoined, GameWinners, GamePotUpdate, PlayerLeft, GameDealerUpdate,
    GameCurrentPlayer, GameBoardUpdate, PlayerCalled, PlayerChecked, PlayerFolded, GameRoundUpdate, PlayerBet, GamePlayersUpdate, Card,
    PlayerEvent, PlayerOverview, SidePot
} from '../../../shared/src';
import { environment } from '../environments/environment';


const POKER_API = environment.poker_api;

@Injectable({
    providedIn: 'root'
})
export class PokerService implements OnDestroy {

    private unsubscribe$ = new Subject();

    constructor(private socket: Socket, private http: HttpClient) {

    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    loadTable(tableName: string): Promise<TableResponse> {
        return this.http.get<TableResponse>(POKER_API + '/table/' + tableName).toPromise();
    }

    loadHomeInfo(): Observable<HomeInfo> {
        return this.http.get<HomeInfo>(POKER_API + '/home');
    }

    homeInfo(): Observable<HomeInfo> {
        return this.socket.fromEvent<HomeInfo>(PokerEvent.HomeInfo);
    }

    createOrJoinRoom(tableName: string, username?: string) {
        this.socket.emit(PlayerEvent.JoinRoom, { playerName: username, roomName: tableName, playerID: localStorage.getItem('playerID') });
    }

    roomJoined(): Observable<ServerJoined> {
        return this.socket.fromEvent<ServerJoined>(PokerEvent.Joined);
    }

    startGame() {
        this.socket.emit(PlayerEvent.StartGame);
    }

    gameStarted(): Observable<unknown> {
        return this.socket.fromEvent(PokerEvent.GameStarted);
    }

    gameEnded(): Observable<unknown> {
        return this.socket.fromEvent(PokerEvent.GameEnded);
    }

    gameStatus(): Observable<GameStatus> {
        return this.socket.fromEvent<GameStatus>(PokerEvent.GameStatus);
    }

    gameWinners(): Observable<GameWinners> {
        return this.socket.fromEvent<GameWinners>(PokerEvent.GameWinners);
    }

    leave() {
        this.socket.emit(PlayerEvent.Leave);
    }

    playerLeft(): Observable<PlayerLeft> {
        return this.socket.fromEvent<PlayerLeft>(PokerEvent.PlayerLeft);
    }

    playersUpdate(): Observable<PlayerOverview[]> {
        return this.socket.fromEvent<GamePlayersUpdate>(PokerEvent.PlayersUpdate)
                   .pipe(map(data => data.players));
    }

    // basically like playersUpdate but includes everyones cards
    playersCards(): Observable<PlayerOverview[]> {
        return this.socket.fromEvent<GamePlayersUpdate>(PokerEvent.PlayersCards)
                   .pipe(map(data => data.players));
    }

    currentPlayer(): Observable<string> {
        return this.socket.fromEvent<GameCurrentPlayer>(PokerEvent.CurrentPlayer)
                   .pipe(map(data => data.currentPlayerID));
    }

    dealerUpdate(): Observable<string> {
        return this.socket.fromEvent<GameDealerUpdate>(PokerEvent.DealerUpdate)
                   .pipe(map(data => data.dealerPlayerID));
    }

    // TODO: Delay each received event 1s, for the auto-play feature if everyone is all-in
    boardUpdated(): Observable<Card[]> {
        return this.socket.fromEvent<GameBoardUpdate>(PokerEvent.BoardUpdate)
                   .pipe(map(data => data.board));
    }

    potUpdate(): Observable<GamePotUpdate> {
        return this.socket.fromEvent<GamePotUpdate>(PokerEvent.PotUpdate);
    }

    mainPotUpdate(): Observable<number> {
        return this.potUpdate()
                   .pipe(map(data => data.pot));
    }

    sidePotUpdate(): Observable<SidePot[]> {
        return this.potUpdate()
                   .pipe(map(data => data.sidePots));
    }


    roundUpdate(): Observable<any> {
        return this.socket.fromEvent<GameRoundUpdate>(PokerEvent.NewRound)
                   .pipe(map(data => data.round));
    }

    tableClosed(): Observable<undefined> {
        return this.socket.fromEvent<undefined>(PokerEvent.TableClosed);
    }

    /********************
     * Game Actions
     ********************/

    check() {
        this.socket.emit(PlayerEvent.Check);
    }

    playerChecked() {
        return this.socket.fromEvent<PlayerChecked>(PokerEvent.PlayerChecked);
    }

    call() {
        this.socket.emit(PlayerEvent.Call);
    }

    playerCalled() {
        return this.socket.fromEvent<PlayerCalled>(PokerEvent.PlayerCalled);
    }

    bet(amount: number) {
        this.socket.emit(PlayerEvent.Bet, amount);
    }

    playerBet() {
        return this.socket.fromEvent<PlayerBet>(PokerEvent.PlayerBet);
    }

    fold() {
        this.socket.emit(PlayerEvent.Fold);
    }

    playerFolded() {
        return this.socket.fromEvent<PlayerFolded>(PokerEvent.PlayerFolded);
    }
}
