import { of, Observable } from 'rxjs';
import { HomeInfo, TableResponse } from '../../../shared/src';

export class PokerServiceMock {


    loadTable(tableName: string): Promise<TableResponse> {
        return of({
                name: tableName,
                players: []
            }
        ).toPromise();
    }

    loadHomeInfo(): Observable<HomeInfo> {
        return of({
            tables: [],
            players: 0
        });
    }

    homeInfo(): Observable<HomeInfo> {
        return this.loadHomeInfo();
    }

    createOrJoinRoom(tableName: string, username?: string) {
    }

    roomJoined() {
        return of();
    }

    startGame() {
    }

    gameStarted(): Observable<unknown> {
        return of();
    }

    gameEnded(): Observable<unknown> {
        return of();
    }

    gameStatus() {
        return of();
    }

    gameWinners() {
        return of();
    }

    leave() {
    }

    playerLeft() {
        return of();
    }

    playersUpdate() {
        return of();
    }

    playersCards() {
        return of();
    }

    currentPlayer() {
        return of();
    }

    dealerUpdate() {
        return of();
    }

    boardUpdated() {
        return of();
    }

    potUpdate() {
        return of();
    }


    roundUpdate() {
        return of();
    }

    tableClosed(): Observable<undefined> {
        return of();
    }

    /********************
     * Game Actions
     ********************/

    check() {

    }

    playerChecked() {
        return of();
    }

    call() {

    }

    playerCalled() {
        return of();
    }

    bet(amount: number) {
    }

    playerBet() {
        return of();
    }

    fold() {

    }

    playerFolded() {
        return of();
    }
}
