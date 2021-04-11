import { HomeInfo, TableResponse, SidePot } from '@shared/src';
import { of, Observable } from 'rxjs';

export class PokerServiceMock {


    loadTable(tableName: string): Promise<TableResponse> {
        return of({
                name: tableName,
                players: [],
                startTime: new Date(),
                config: {
                    spectatorsAllowed: true,
                    isPublic: true,
                    turn: {
                        time: -1,
                        autoFold: false
                    },
                    chips: 1000,
                    blinds: {
                        small: 10,
                        big: 20,
                        duration: -1
                    },
                    music: false,
                    afk: {
                        delay: 30000
                    },
                    players: {
                        min: 2,
                        max: 8
                    },
                    table: {
                        autoClose: true,
                        rebuy: false
                    }
                }
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

    joinAsSpectator(tableName: string) {
    }

    roomJoined() {
        return of();
    }

    requestUpdate() {
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

    playerKicked() {
        return of();
    }

    dealerUpdate() {
        return of();
    }

    boardUpdated() {
        return of();
    }

    mainPotUpdate(): Observable<number> {
        return of(666);
    }

    sidePotUpdate(): Observable<SidePot[]> {
        return of();
    }

    roundUpdate() {
        return of();
    }

    maxBetUpdate() {
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
