import { Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import * as PokerEvaluator from 'poker-evaluator';
import { Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { GameStatus, Card, BetType, RoundType, PlayerOverview } from '../../../shared/src';
import { TableConfig } from '../../config/table.config';
import { Game } from '../Game';
import { Player } from '../Player';
import { TableCommand, TableCommandName } from './TableCommand';


export class Table {
    private playerColors = [
        '#444444', '#3498db', '#9b59b6',
        '#e67e22', '#3ae374', '#16a085',
        'crimson', '#227093', '#d1ccc0',
        '#34495e', '#673ab7', '#cf6a87'
    ];

    players: Player[] = [];
    dealer: number;	// index of the current dealer
    currentPlayer: number; // index of the current player
    private game: Game | undefined;

    commands$: Subject<TableCommand>;

    private logger;
    constructor(
        private CONFIG: TableConfig,
        public smallBlind: number,
        public bigBlind: number,
        public minPlayers: number,
        public maxPlayers: number,
        public name: string) {
        this.logger = new Logger(`Table[${ name }]`);
        this.logger.debug(`Created!`);

        if (this.CONFIG.NEXT_GAME_DELAY < this.CONFIG.END_GAME_DELAY) {
            throw Error('Next game must not be triggered before the end game!');
        }

        //require at least two players to start a game.
        if (minPlayers < 2) {
            throw new Error('Parameter [minPlayers] must be a positive integer of a minimum value of 2.');
        }

        if (minPlayers > maxPlayers) {
            throw new Error('Parameter [minPlayers] must be less than or equal to [maxPlayers].');
        }
    }

    public hasGame(): boolean {
        return !!this.game;
    }

    public isGameEnded(): boolean {
        return this.game.ended;
    }

    public getPlayer(playerID: string): Player {
        return this.players.find(player => player.id === playerID);
    }

    public isPlayer(playerID: string): boolean {
        return this.players.some(player => player.id === playerID);
    }

    public getGameStatus(): GameStatus {
        if (this.game) {
            return this.game.ended ? GameStatus.Ended : GameStatus.Started;
        }
        return GameStatus.Waiting;
    }

    public getPlayersPreview(showCards = false): PlayerOverview[] {
        return this.players.map(player => {
            return {
                id: player.id,
                name: player.name,
                chips: player.chips,
                bet: player.bet,
                cards: showCards && !player.folded ? remapCards(player.cards) : hideCards(player.cards),
                allIn: player.allIn,
                folded: player.folded,
                color: player.color,
                disconnected: player.disconnected
            } as PlayerOverview;
        });
    }

    public addPlayer(playerName: string, chips: number): string {
        if (this.game) {
            throw new WsException('Game already started');
        }

        if (this.players.length < this.maxPlayers) {
            // create and add a new player
            const playerID = uuidv4();
            this.players.push(new Player(playerID, playerName, this.getPlayerColor(), chips));
            return playerID;
        } else {
            throw new WsException('Table is already full!');
        }
    }

    private setStartPlayer() {
        // just hardcoded dealer is always last and small blind is first, maybe do better
        // check if dealer was set already, so move it further instead
        if (this.dealer) {
            this.dealer = getNextIndex(this.dealer, this.players);
            this.currentPlayer = getNextIndex(this.dealer, this.players);
        } else {
            this.dealer = this.players.length - 1;
            this.currentPlayer = 0;
        }
        this.sendCurrentPlayer();
        this.sendDealerUpdate();
    }

    private showPlayersCards() {
        this.commands$.next({
            name: TableCommandName.PlayersCards,
            table: this.name,
            data: { players: this.getPlayersPreview(true) }
        });
    }

    private removePlayerCards() {
        for (let player of this.players) {
            player.cards = [];
        }
    }


    /***
     * Player Turn logic:

     first after dealer starts
     - if bet was not called by everyone, next player who did not fold


     Heads Up (1vs1):
     - dealer is small blind

     */
    private nextPlayer() {
        let maxTries = 0;

        do {
            if (maxTries++ > this.players.length) {
                throw Error('Infinity loop detected in nextPlayer()');
            }

            // if last player, continue with first
            this.currentPlayer = this.currentPlayer === this.players.length - 1 ? 0 : this.currentPlayer + 1;
        } while (this.players[this.currentPlayer].folded);

        this.sendCurrentPlayer();
    }

    public getPlayerIndexByID(playerID: string): number {
        return this.players.findIndex(player => player.id === playerID);
    }

    public sendPlayersUpdate() {
        this.commands$.next({
            name: TableCommandName.PlayerUpdate,
            table: this.name,
            data: { players: this.players }
        });
    }

    public sendPlayerBet(playerID: string, bet: number, maxBet: number, type: BetType) {
        this.commands$.next({
            name: TableCommandName.PlayerBet,
            table: this.name,
            data: { playerID, bet, type, maxBet }
        });
    }

    public sendPotUpdate() {
        this.commands$.next({
            name: TableCommandName.PotUpdate,
            table: this.name,
            data: { pot: this.game.pot }
        });
    }

    public sendGameBoardUpdate() {
        this.commands$.next({
            name: TableCommandName.BoardUpdated,
            table: this.name,
            data: { board: remapCards(this.game.board) }
        });
    }

    public sendGameRoundUpdate() {
        this.commands$.next({
            name: TableCommandName.NewRound,
            table: this.name,
            data: { round: this.game.round }
        });
    }

    public sendGameStarted() {
        this.commands$.next({
            name: TableCommandName.GameStarted,
            table: this.name,
            data: { players: this.players }
        });
    }

    private sendGameEnded() {
        this.commands$.next({
            name: TableCommandName.GameEnded,
            table: this.name
        });
    }

    public sendTableClosed() {
        this.commands$.next({
            name: TableCommandName.TableClosed,
            table: this.name
        });
    }

    private sendGameStatusUpdate() {
        this.commands$.next({
            name: TableCommandName.GameStatus,
            table: this.name,
            data: { gameStatus: this.getGameStatus() }
        });
    }

    public sendCurrentPlayer() {
        this.commands$.next({
            name: TableCommandName.CurrentPlayer,
            table: this.name,
            data: { currentPlayerID: this.players[this.currentPlayer].id }
        });
    }

    public sendDealerUpdate() {
        this.commands$.next({
            name: TableCommandName.Dealer,
            table: this.name,
            data: { dealerPlayerID: this.players[this.dealer].id }
        });
    }

    public newGame() {

        if (this.players.length < this.minPlayers) {
            throw new WsException('Cant start game. Too less players are in.');
        }

        this.removePoorPlayers();

        // check if we removed everyone but the winner due to money issue
        if (this.players.length === 1) {
            this.sendTableClosed();
            return;
        }

        this.players.map(player => player.reset());
        this.setStartPlayer();

        this.game = new Game(this.smallBlind, this.bigBlind, `Game[${ this.name }]`);
        this.dealCards();

        this.sendPotUpdate();
        this.sendGameBoardUpdate();
        this.sendGameRoundUpdate();
        this.sendGameStarted();

        // auto bet small & big blind
        this.bet(this.players[this.currentPlayer].id, this.smallBlind, BetType.SmallBlind);
        this.bet(this.players[this.currentPlayer].id, this.bigBlind, BetType.BigBlind);
    }

    private dealCards() {
        this.removePlayerCards();

        // Deal 2 cards to each player
        for (let x = 0; x < 2; x++) {
            for (let player of this.players) {
                player.cards.push(this.game.deck.pop());
            }
        }
    }

    public call(playerID: string) {
        const playerIndex = this.getPlayerIndexByID(playerID);
        if (playerIndex !== this.currentPlayer) {
            throw new WsException('Not your turn!');
        }

        const existingBet = this.game.getBet(playerIndex);
        const maxBet = this.game.getMaxBet();
        if (!maxBet || maxBet - existingBet === 0) {
            throw new WsException(`Can't call. No bet to call.`);
        }

        let betToPay = existingBet ? maxBet - existingBet : maxBet;

        const player = this.players[playerIndex];
        player.bet += betToPay;
        player.pay(betToPay);

        this.game.call(playerIndex);

        const next = this.progress();
        if (next) {
            this.nextPlayer();
            this.sendPlayersUpdate();
        }
    }

    public bet(playerID: string, bet: number, type: BetType = BetType.Bet) {
        const playerIndex = this.getPlayerIndexByID(playerID);
        if (playerIndex !== this.currentPlayer) {
            throw new WsException('Not your turn!');
        }

        const player = this.players[playerIndex];
        player.pay(bet);

        // if the player has already bet, add it to the current
        const totalBet = player.bet ? player.bet + bet : bet;
        player.bet = totalBet;

        this.game.bet(playerIndex, totalBet);

        const maxBet = this.game.getMaxBet();

        this.sendPlayerBet(playerID, bet, maxBet, type);
        this.sendPlayersUpdate();
        this.nextPlayer();
    }

    public fold(playerID: string) {
        const playerIndex = this.getPlayerIndexByID(playerID);
        if (playerIndex !== this.currentPlayer) {
            throw new WsException('Not your turn!');
        }

        const player = this.players[playerIndex];
        player.folded = true;

        const next = this.progress();
        if (next) {
            this.nextPlayer();
            this.sendPlayersUpdate();
        }
    }

    public check(playerID: string) {
        const playerIndex = this.getPlayerIndexByID(playerID);
        if (playerIndex !== this.currentPlayer) {
            throw new WsException('Not your turn!');
        }

        this.game.check(playerIndex);

        const next = this.progress();
        if (next) {
            this.nextPlayer();
            this.sendPlayersUpdate();
        }
    }

    private isEndOfRound(): boolean {
        let endOfRound = true;
        const maxBet = this.game.getMaxBet();
        // check if each player has folded or everyone has called
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].folded === false) {
                if (this.game.getBet(i) !== maxBet) {
                    endOfRound = false;
                    break;
                }
            }
        }
        return endOfRound;
    }

    private hasEveryoneElseFolded(): boolean {
        return this.players.filter(player => !player.folded).length === 1;
    }

    private progress(): boolean {
        const everyoneElseFolded = this.hasEveryoneElseFolded();
        if (this.isEndOfRound() || everyoneElseFolded) {

            this.game.moveBetsToPot();
            this.resetPlayerBets();
            this.sendPotUpdate();

            const round = this.game.round.type;

            // if we are in the last round and everyone has either called or folded
            if (round === RoundType.River || everyoneElseFolded) {

                this.logger.debug('Game ended!');
                this.sendGameEnded();

                // only show cards if it was the last betting round
                if (round === RoundType.River) {
                    this.showPlayersCards();
                }

                // wait for the winner announcement
                setTimeout(() => {
                    this.processWinners(everyoneElseFolded);
                }, this.CONFIG.END_GAME_DELAY);

                // auto-create new game
                setTimeout(() => {
                    this.newGame();
                }, this.CONFIG.NEXT_GAME_DELAY);

                // stop the game progress since we are done
                return false;
            }

            switch (round) {
                case RoundType.Deal:
                    this.game.newRound(RoundType.Flop);
                    break;
                case RoundType.Flop:
                    this.game.newRound(RoundType.Turn);
                    break;
                case RoundType.Turn:
                    this.game.newRound(RoundType.River);
                    break;
                default:
                    break;
            }
            this.sendGameRoundUpdate();
            this.sendGameBoardUpdate();
            // let player after dealer start, so set it to the dealer
            this.currentPlayer = this.dealer;
        }
        return true;
    }


    private processWinners(everyoneElseFolded: boolean) {

        const winners = this.getWinners(everyoneElseFolded);
        let pot = this.game.pot;

        if (winners.length === 1) {
            this.logger.debug(`Player[${ winners[0].name }] has won the game and receives ${ pot }!`);
            winners[0].chips += pot;
        } else {
            let winnerNames = winners.reduce((prev, cur) => prev + ', ' + cur.name, '');
            let earnings = Math.round(pot / winners.length);
            this.logger.debug(`Players[${ winnerNames }] have a tie and split the pot for ${ earnings } each!`);

            for (const winner of winners) {
                winner.chips += earnings;
            }
        }

        // announce winner
        this.commands$.next({
            name: TableCommandName.GameWinners,
            table: this.name,
            data: { pot, winners }
        });
    }

    private getWinners(everyoneElseFolded: boolean): Player[] {

        // find the highest hand from not folded players
        const availablePlayers = this.players.filter(player => !player.folded);

        // if everyone folded, no need to rank hands
        if (everyoneElseFolded) {
            return availablePlayers;
        }

        this.rankAllHands();

        const winner = availablePlayers.reduce((prev, cur) => {
            return (prev.hand.value > cur.hand.value) ? prev : cur;
        });

        // then return all players with that hand
        return this.players.filter(player => player.hand?.value === winner.hand.value);
    }

    private rankHand(player: Player) {
        player.hand = PokerEvaluator.evalHand([...player.cards, ...this.game.board]);
    }

    private rankAllHands() {
        for (let player of this.players) {
            // only rank players still in the game
            if (!player.folded) {
                this.rankHand(player);
            }
        }
    }

    private getPlayerColor(): string {
        return this.playerColors.pop();
    }

    // Test utils method
    public getRoundType(): RoundType {
        return this.game.round.type;
    }

    public getGame(): Game {
        return this.game;
    }

    private resetPlayerBets() {
        this.players.map(player => player.bet = null);
    }

    private removePoorPlayers() {
        this.players = this.players.filter(player => {
            if (player.chips > this.bigBlind) {
                return true;
            }
            this.logger.verbose(`Removing player[${ player.name }] from the table because chips[${ player.chips }] are not enough.`);
            return false;
        });

        this.sendPlayersUpdate();
    }
}

function getNextIndex(currentIndex: number, array: any[]): number {
    if (currentIndex >= array.length) {
        return 0;
    }
    return currentIndex === array.length - 1 ? 0 : currentIndex + 1;
}

function hideCards(cards: any[]): Card[] | undefined {
    if (!cards) {
        return undefined;
    }

    return cards.map(() => {
        return { value: 0, figure: 'back' };
    });
}

export function remapCards(cards: string[]): Card[] {
    return cards.map(card => {
        const c = card.split('');
        // remap T to 10
        c[0] = c[0] === 'T' ? '10' : c[0];
        return { value: c[0], figure: c[1] };
    });
}
