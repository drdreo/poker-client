import { Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import * as PokerEvaluator from 'poker-evaluator';
import { Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Game, Round, RoundType } from '../Game';
import { Player, PlayerPreview } from '../Player';

export interface TableCommand {
    cmd: string;
    table: string;
    data?: {
        players?,
        playerID?: string,
        currentPlayerID?: string,
        dealerPlayerID?: string,
        pot?: number,
        bet?: number,
        board?: string[],
        round?: Round,
        winners?: Player[],
        gameStatus?: string
    };
}

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

    protected endGameDelay = 1500;
    protected nextGameDelay = 5000;

    constructor(
        public smallBlind: number,
        public bigBlind: number,
        public minPlayers: number,
        public maxPlayers: number,
        public name: string) {
        Logger.debug(`Table[${ name }]created!`);

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

    public getGameStatus() {
        if (this.game) {
            return this.game.ended ? 'ended' : 'started';
        }
        return 'waiting';
    }

    public getPlayersPreview(showCards = false): PlayerPreview[] {
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
            };
        });
    }

    public addPlayer(playerName: string, chips: number): string {
        //If there is no current game and we have enough players, start a new game.
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
            cmd: 'players_cards',
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
            cmd: 'player_update',
            table: this.name,
            data: { players: this.players }
        });
    }

    public sendPlayerBet(playerID: string, bet: number) {
        this.commands$.next({
            cmd: 'player_bet',
            table: this.name,
            data: { playerID, bet }
        });
    }

    public sendPotUpdate() {
        this.commands$.next({
            cmd: 'pot_update',
            table: this.name,
            data: { pot: this.game.pot }
        });
    }

    public sendGameBoardUpdate() {
        this.commands$.next({
            cmd: 'board_updated',
            table: this.name,
            data: { board: this.game.board }
        });
    }

    public sendGameRoundUpdate() {
        this.commands$.next({
            cmd: 'new_round',
            table: this.name,
            data: { round: this.game.round }
        });
    }

    public sendGameStarted() {
        this.commands$.next({
            cmd: 'game_started',
            table: this.name,
            data: { players: this.players }
        });
    }

    private sendGameEnded() {
        this.commands$.next({
            cmd: 'game_ended',
            table: this.name
        });
    }

    public sendTableClosed() {
        this.commands$.next({
            cmd: 'table_closed',
            table: this.name
        });
    }


    private sendGameStatusUpdate() {
        this.commands$.next({
            cmd: 'game_status',
            table: this.name,
            data: { gameStatus: this.getGameStatus() }
        });
    }

    public sendCurrentPlayer() {
        this.commands$.next({
            cmd: 'current_player',
            table: this.name,
            data: { currentPlayerID: this.players[this.currentPlayer].id }
        });
    }


    public sendDealerUpdate() {
        this.commands$.next({
            cmd: 'dealer',
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

        this.game = new Game(this.smallBlind, this.bigBlind);
        this.dealCards();

        this.sendPotUpdate();
        this.sendGameBoardUpdate();
        this.sendGameRoundUpdate();
        this.sendGameStarted();

        // auto bet small & big blind
        this.bet(this.players[this.currentPlayer].id, this.smallBlind);
        this.bet(this.players[this.currentPlayer].id, this.bigBlind);
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

    public bet(playerID: string, bet: number) {
        const playerIndex = this.getPlayerIndexByID(playerID);
        if (playerIndex !== this.currentPlayer) {
            throw new WsException('Not your turn!');
        }

        const player = this.players[playerIndex];
        player.bet = bet;
        player.pay(bet);

        this.game.bet(playerIndex, bet);

        this.nextPlayer();
        this.sendPlayersUpdate();
        this.sendPlayerBet(playerID, bet);
    }

    public fold(playerID: string) {
        const playerIndex = this.getPlayerIndexByID(playerID);
        if (playerIndex !== this.currentPlayer) {
            throw new WsException('Not your turn!');
        }

        const player = this.players[playerIndex];
        player.folded = true;

        this.game.check(playerIndex); // mark the bet like checked

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

                Logger.debug('Game ended!');
                this.sendGameEnded();

                // only show cards if it was the last betting round
                if (round === RoundType.River) {
                    this.showPlayersCards();
                }

                // wait for the winner announcement
                setTimeout(() => {
                    this.processWinners(everyoneElseFolded);
                }, this.endGameDelay);

                // auto-create new game
                setTimeout(() => {
                    this.newGame();
                }, this.nextGameDelay);

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
            Logger.debug(`Player[${ winners[0].name }] has won the game and receives ${ pot }!`);
            winners[0].chips += pot;
        } else {
            let winnerNames = winners.reduce((prev, cur) => prev + ', ' + cur.name, '');
            let earnings = Math.round(pot / winners.length);
            Logger.debug(`Players[${ winnerNames }] have a tie and split the pot for ${ earnings } each!`);

            for (const winner of winners) {
                winner.chips += earnings;
            }
        }


        // announce winner
        this.commands$.next({
            cmd: 'game_winners',
            table: this.name,
            data: { pot, winners }
        });


        // // reset player status
        // this.players.map(player => player.reset());
        // this.sendPlayersUpdate();
        //

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
            Logger.verbose(`Removing player[${ player.name }] from the table because chips[${ player.chips }] are not enough.`);
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

function hideCards(cards) {
    if (!cards) {
        return undefined;
    }

    return cards.map(() => {
        return { value: 0, figure: 'back' };
    });
}

export function remapCards(cards) {
    return cards.map(card => {
        const c = card.split('');
        // remap T to 10
        c[0] = c[0] === 'T' ? '10' : c[0];
        return { value: c[0], figure: c[1] };
    });
}
