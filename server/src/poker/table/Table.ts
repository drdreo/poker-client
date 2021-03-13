import { Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import * as PokerEvaluator from 'poker-evaluator';
import { Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { GameStatus, Card, BetType, RoundType, PlayerOverview, SidePot, Winner, SidePotPlayer } from '../../../../shared/src';
import { TableConfig } from '../../config/table.config';
import { Game, Bet } from '../Game';
import { Player } from '../Player';
import { TableCommand, TableCommandName } from './TableCommand';
import Timeout = NodeJS.Timeout;


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

    startTime = new Date();

    private logger;
    private timeouts: Timeout[] = [];

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

    public destroy(): void {
        this.timeouts.forEach(timeout => {
            clearTimeout(timeout);
        });
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

    private hasEveryoneElseFolded(): boolean {
        return this.getActivePlayers().length === 1;
    }

    private getActivePlayers(): Player[] {
        return this.players.filter(player => !player.folded);
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

    public getSidePots(): SidePot[] {
        const pots: SidePot[] = [];
        for (let pot of this.game.sidePots) {
            const potPlayers = pot.players.reduce((prev, cur) => {
                prev.push(Player.getSidePotPlayer(cur));
                return prev;
            }, [] as SidePotPlayer[]);
            pots.push({ amount: pot.amount, players: potPlayers });
        }
        return pots;
    }

    public getPlayersPreview(showCards = false): PlayerOverview[] {
        return this.players.map(player => {
            return Player.getPlayerOverview(player, showCards);
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

        // heads up rules, dealer is SB and acts first
        let headsUp = this.players.length === 2;

        // just hardcoded dealer is always last and small blind is first
        // check if dealer was set already, so move it further instead
        if (this.dealer) {
            this.dealer = getNextIndex(this.dealer, this.players);
            this.currentPlayer = headsUp ? this.dealer : getNextIndex(this.dealer, this.players);
        } else {
            this.dealer = this.players.length - 1;
            this.currentPlayer = headsUp ? this.dealer : 0;
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
        } while (this.players[this.currentPlayer].folded || this.players[this.currentPlayer].allIn);

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

    public sendPlayerBet(playerID: string, bet: number, type: BetType) {
        this.commands$.next({
            name: TableCommandName.PlayerBet,
            table: this.name,
            data: { playerID, bet, type, maxBet: this.game.getMaxBet() }
        });
    }

    public sendPotUpdate() {
        this.commands$.next({
            name: TableCommandName.PotUpdate,
            table: this.name,
            data: { pot: this.game.pot, sidePots: this.getSidePots() }
        });
    }

    public sendMaxBetUpdate() {
        this.commands$.next({
            name: TableCommandName.MaxBetUpdate,
            table: this.name,
            data: { maxBet: this.game.getMaxBet() }
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
        const currentPlayer = this.players[this.currentPlayer];
        if (currentPlayer) {
            this.commands$.next({
                name: TableCommandName.CurrentPlayer,
                table: this.name,
                data: { currentPlayerID: currentPlayer.id }
            });
        } else {
            this.logger.warn('No current player set.');
        }

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
        const player = this.players[playerIndex];
        const existingBet = this.game.getBetAmount(playerIndex);
        const maxBet = this.game.getMaxBet();

        if (!maxBet || maxBet - existingBet === 0) {
            throw new WsException(`Can't call. No bet to call.`);
        }

        let betToPay = existingBet ? maxBet - existingBet : maxBet;
        betToPay = betToPay > player.chips ? player.chips : betToPay;// limit to go all-in
        this.bet(playerID, betToPay, BetType.Call);

        //
        // const player = this.players[playerIndex];
        // player.pay(betToPay);
        // player.bet.amount += betToPay;
        //
        // this.game.call(playerIndex);

        // const next = this.progress();
        // if (next) {
        //     this.nextPlayer();
        //     this.sendPlayersUpdate();
        // }
    }

    public bet(playerID: string, bet: number, type: BetType = BetType.Bet) {

        const playerIndex = this.getPlayerIndexByID(playerID);
        if (playerIndex !== this.currentPlayer) {
            throw new WsException('Not your turn!');
        }

        const player = this.players[playerIndex];
        this.logger.debug(`Player[${ player.name }] bet [${ bet }]!`);

        // Check if bet was at least max bet but let call bets still proceed
        if (type !== BetType.Call) {
            const maxBet = this.game.getMaxBet();
            if (bet < maxBet && bet != player.chips) {
                throw new WsException('Can not bet less than max bet!');
            }
        }

        player.pay(bet);
        // check if all-in
        if (player.chips <= 0) {
            player.allIn = true;
            this.logger.debug(player.name + ' went all-in!');
        }

        const playerBet = new Bet(bet, type);

        // if the player has already bet, add it to the current
        const existingBet = player.bet;
        if (existingBet) {
            playerBet.amount += existingBet.amount;
        }

        player.bet = playerBet;

        this.game.bet(playerIndex, playerBet);

        this.sendPlayerBet(playerID, bet, type);

        const next = this.progress();
        if (next) {
            this.nextPlayer();
            this.sendPlayersUpdate();
        }
    }

    public fold(playerID: string) {
        const playerIndex = this.getPlayerIndexByID(playerID);
        if (playerIndex !== this.currentPlayer) {
            throw new WsException('Not your turn!');
        }

        const player = this.players[playerIndex];
        this.logger.debug(`Player[${ player.name }] folded!`);

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
        this.logger.debug(`Player[${ playerID }] checked!`);

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
        // check if each player has folded, called or is all-in
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].folded === false && !this.players[i].allIn) {
                const playersBet = this.game.getBet(i);
                if (playersBet?.amount !== maxBet || playersBet.type === BetType.BigBlind) { // if other players just call the BB, give the BB an option as well
                    endOfRound = false;
                    break;
                }
            }
        }
        return endOfRound;
    }

    // Either all players have folded, met the biggest bet, or raised / gone all-in.
    // private hasEveryoneActed(): boolean {
    //     let everyoneActed = true;
    //     const maxBet = this.game.getMaxBet();
    //     for (let i = 0; i < this.players.length; i++) {
    //         if (this.players[i].folded === false || !this.players[i].allIn) {
    //             if (this.game.getBet(i) <=  maxBet) {
    //                 everyoneActed = false;
    //                 break;
    //             }
    //         }
    //     }
    //     return everyoneActed;
    // }

    private nextRound(round: RoundType): RoundType {
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
        this.sendGameBoardUpdate();
        return this.game.round.type;
    }

    private progress(): boolean {
        const everyoneElseFolded = this.hasEveryoneElseFolded();

        if (this.isEndOfRound() || everyoneElseFolded) {
            let round = this.game.round.type;
            this.logger.debug(`Round[${ round }] ended!`);

            this.processBets(everyoneElseFolded);

            // all players all in or all except one is all in
            const allInPlayers = this.players.filter(player => player.allIn);
            if (allInPlayers.length != 0 && allInPlayers.length >= this.getActivePlayers().length - 1) { // TODO: HEADS UP is des voisch wenn wer folded
                this.logger.debug('All in situation, auto-play game');
                this.showPlayersCards();

                // play until RoundType.River
                do {
                    round = this.nextRound(round);
                } while (round !== RoundType.River);
            }

            // if we are in the last round and everyone has either called or folded
            if (round === RoundType.River || everyoneElseFolded) {
                this.logger.debug('Game ended!');
                this.sendGameEnded();

                // only show cards if it was the last betting round
                if (round === RoundType.River) {
                    this.showPlayersCards(); // showing cards twice if all-in situation
                }

                // wait for the winner announcement. Maximum of 5s card display delay
                this.timeouts.push(setTimeout(() => {
                    this.processWinners(everyoneElseFolded);
                    // hide pot after giving it to the winner
                    this.game.resetPots();
                    this.sendPotUpdate();

                    // auto-create new game
                    this.timeouts.push(setTimeout(() => {
                        this.newGame();
                    }, this.CONFIG.NEXT_GAME_DELAY));
                }, this.CONFIG.END_GAME_DELAY));

                // stop the game progress since we are done
                return false;
            }

            this.nextRound(round);
            this.sendGameRoundUpdate();
            // let player after dealer start, so set it to the dealer
            this.currentPlayer = this.dealer;
        }
        return true;
    }

    private processBets(everyoneElseFolded: boolean = false) {
        // let activePlayers = this.players.filter(player => player.bet > 0);
        let activePlayers = this.players.filter(player => player.bet?.amount > 0 || !player.folded && player.allIn && !player.hasSidePot);
        const allInPlayers = activePlayers.filter(player => player.allIn);

        // handle split pots if someone went all-in, and a player raised or bet
        const allinBets = allInPlayers.reduce((bets, player) => {
            const idx = this.getPlayerIndexByID(player.id);
            const bet = this.game.getBetAmount(idx);
            bets.push(bet);
            return bets;
        }, [] as number[]);

        const maxBet = this.game.getMaxBet();
        const raised = allinBets.some(bet => bet < maxBet);
        const allInButNoBet = allinBets.some(bet => !bet);
        // if the all-in bet is maxBet
        if (maxBet && allInButNoBet) {
            this.game.createSidePot(activePlayers);
        }

        if (allInPlayers.length > 0 && raised) {
            this.logger.debug('Creating new side pot cause someone went all in!');

            let potPlayers = [];
            do {
                const lowestBet = this.game.getLowestBet();
                let pot = 0;
                for (let i = 0; i < this.players.length; i++) {
                    const player = this.players[i];

                    if (player.bet?.amount > 0) {
                        pot += lowestBet;
                        player.bet.amount -= lowestBet;
                        this.game.bet(i, player.bet);
                        potPlayers.push(player);
                    }
                }

                this.game.pot += pot;

                activePlayers = this.players.filter(player => player.bet?.amount > 0);
                if (activePlayers.length > 1) {
                    this.game.createSidePot(potPlayers);
                    potPlayers = [];
                }
            } while (activePlayers.length > 1);

            // if there is money left, give it back
            const leftOvers = this.game.getLastBet();
            if (leftOvers) {
                this.players[leftOvers.index].chips += leftOvers.bet;
            }

        } else {
            // if everyone else folded, repay the last bet if it existed
            if (everyoneElseFolded) {
                const lastPlayer = this.getActivePlayers()[0];
                const lastPlayerIndex = this.getPlayerIndexByID(lastPlayer.id);
                const lastPlayersBet = this.game.getBet(lastPlayerIndex);
                if (lastPlayersBet) {
                    lastPlayer.chips += lastPlayersBet.amount;
                    this.game.betNewBet(lastPlayerIndex, 0, lastPlayersBet.type);
                }
            }
            this.game.moveBetsToPot();
        }

        this.resetPlayerBets();
        this.game.round.bets = [];
        this.sendPotUpdate();
    }

    private processWinners(everyoneElseFolded: boolean) {

        const availablePlayers = this.players.filter(player => !player.folded && !player.hasSidePot);

        let mainPot = this.game.pot;
        const winners: Winner[] = [];
        winners.push(...this.mapWinners(availablePlayers, everyoneElseFolded, mainPot, 'main'));

        // if there were side pots, process the winners of each
        for (let i = 0; i < this.game.sidePots.length; i++) {
            let sidePot = this.game.sidePots[i];
            const potPlayers = sidePot.players.filter(player => !player.folded); // remove folded players
            winners.push(...this.mapWinners(potPlayers, everyoneElseFolded, sidePot.amount, 'sidepot' + i));
        }

        if (winners.length === 1) {
            this.logger.debug(`Player[${ winners[0].name }] has won the game and receives ${ winners[0].amount }!`);
        } else {
            let winnerNames = winners.reduce((prev, cur) => prev + ', ' + cur.name, '');
            this.logger.debug(`Players[${ winnerNames }] won!`);
        }

        // pay the winners
        for (const winner of winners) {
            this.getPlayer(winner.id).chips += winner.amount;
        }

        // announce winner
        this.commands$.next({
            name: TableCommandName.GameWinners,
            table: this.name,
            data: { winners }
        });
    }

    private mapWinners(availablePlayers: Player[], everyoneElseFolded: boolean, pot: number, potType: string): Winner[] {
        const potWinners = [...this.getWinners(availablePlayers, everyoneElseFolded)];
        const potEarning = pot / potWinners.length;
        return potWinners.map((player) => {
            return { ...player.formatWinner(), potType, amount: potEarning };
        });
    }

    private getWinners(availablePlayers: Player[], everyoneElseFolded: boolean): Player[] {

        // if everyone folded, no need to rank hands
        if (everyoneElseFolded) {
            return availablePlayers;
        }

        this.rankAllHands();

        const winner = availablePlayers.reduce((prev, cur) => {
            return (prev.hand.value > cur.hand.value) ? prev : cur;
        });

        // then return all players with that hand
        return availablePlayers.filter(player => player.hand?.value === winner.hand.value);
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

export function hideCards(cards: any[]): Card[] | undefined {
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
