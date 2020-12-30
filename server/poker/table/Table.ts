import { Player, PlayerPreview } from '../Player';
import { WsException } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Game, RoundType } from '../Game';
import { v4 as uuidv4 } from 'uuid';
import { Subject } from 'rxjs';
import * as PokerEvaluator from 'poker-evaluator';

export interface TableCommand {
    cmd: string;
    table: string;
    data: {
        players?,
        nextPlayerID?: string,
        pot? : number,
        board?: string[],
        winners?: Player[]
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

    protected gameEndDelay = 1500;

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

    public getPlayer(playerID: string): Player {
        return this.players.find(player => player.id === playerID);
    }

    public isPlayer(playerID: string): boolean {
        return this.players.some(player => player.id === playerID);
    }

    public getPlayersPreview(showCards = false): PlayerPreview[] {
        return this.players.map(player => {
            return {
                id: player.id,
                name: player.name,
                chips: player.chips,
                cards: showCards ? remapCards(player.cards) : undefined,
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

    private nextPlayer() {
        let maxTries = 0;

        do {
            if (maxTries++ > this.players.length) {
                throw Error('Infinity loop detected in nextPlayer()');
            }

            // if last player, continue with first
            this.currentPlayer = this.currentPlayer === this.players.length - 1 ? 0 : this.currentPlayer + 1;
        } while (this.players[this.currentPlayer].folded);

        this.commands$.next({ cmd: 'game:next_player', table: this.name, data: { nextPlayerID: this.players[this.currentPlayer].id } });
    }

    public getPlayerIndexByID(playerID: string): number {
        return this.players.findIndex(player => player.id === playerID);
    }

    private playersUpdate() {
        this.commands$.next({
            cmd: 'player_update',
            table: this.name,
            data: { players: this.players }
        });
    }

    public newGame() {
        if (this.players.length < this.minPlayers) {
            throw new WsException('Cant start game. Too less players are in.');
        }
        this.game = new Game(this.smallBlind, this.bigBlind);
        this.setStartPlayer();
        this.dealCards();
        this.commands$.next({
            cmd: 'game_started',
            table: this.name,
            data: { players: this.players }
        });
        this.commands$.next({ cmd: 'game:next_player', table: this.name, data: { nextPlayerID: this.players[this.currentPlayer].id } });
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
        let betToPay = existingBet ? maxBet - existingBet : maxBet;

        this.players[playerIndex].pay(betToPay);
        this.game.call(playerIndex);

        this.playersUpdate();

        const next = this.progress();
        if (next) {
            this.nextPlayer();
        }
    }

    public bet(playerID: string, bet: number) {
        const playerIndex = this.getPlayerIndexByID(playerID);
        if (playerIndex !== this.currentPlayer) {
            throw new WsException('Not your turn!');
        }

        this.players[playerIndex].pay(bet);
        this.game.bet(playerIndex, bet);

        this.playersUpdate();
        this.nextPlayer();
    }

    public fold(playerID: string) {
        const playerIndex = this.getPlayerIndexByID(playerID);
        if (playerIndex !== this.currentPlayer) {
            throw new WsException('Not your turn!');
        }

        const player = this.players[playerIndex];
        player.folded = true;

        this.game.check(playerIndex); // mark the bet like checked

        this.playersUpdate();

        const next = this.progress();
        if (next) {
            this.nextPlayer();
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
        if (this.isEndOfRound()) {

            this.game.moveBetsToPot();

            const round = this.game.round.type;

            // if we are in the last round and everyone has either called or folded
            if (round === RoundType.River || this.hasEveryoneElseFolded()) {

                this.showPlayersCards();
                // delay the end game reveal
                setTimeout(() => {
                    Logger.debug('Game ended, starting a new one');
                    this.gameEnded();
                }, this.gameEndDelay);

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
            this.commands$.next({
                cmd: 'game:board_updated',
                table: this.name,
                data: { board: this.game.board }
            });
            // let the small blind start again
            this.currentPlayer = this.dealer;
        }
        return true;
    }

    private gameEnded() {

        const winners = this.getWinners();
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
            cmd: 'game_ended',
            table: this.name,
            data: { pot, winners }
        });

        // reset player status
        this.players.map(player => player.reset());

        // auto-create new game
        this.newGame();
    }

    private getWinners(): Player[] {
        this.rankAllHands();

        // first find the highest hand
        const winner = this.players.reduce((prev, cur) => {
            return (prev.hand?.value > cur.hand.value) ? prev : cur;
        });

        // then return all players with that hand
        return this.players.filter(player => player.hand.value === winner.hand.value);
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
}

function getNextIndex(currentIndex: number, array: any[]): number {
    return currentIndex === array.length - 1 ? 0 : currentIndex + 1;
}

function remapCards(cards) {
    return cards.map(card => {
        const c = card.split('');
        // remap T to 10
        c[0] = c[0] === 'T' ? '10' : c[0];
        return { value: c[0], figure: c[1] };
    });
}
