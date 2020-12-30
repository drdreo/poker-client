import { Player, PlayerPreview } from '../Player';
import { WsException } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Game, RoundType } from '../Game';
import { v4 as uuidv4 } from 'uuid';
import { Subject } from 'rxjs';
import * as PokerEvaluator from 'poker-evaluator';

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

    commands$: Subject<any>;

    constructor(
        public smallBlind: number,
        public bigBlind: number,
        public minPlayers: number,
        public maxPlayers: number,
        public name: string,
        public minBuyIn: number,
        public maxBuyIn: number) {
        Logger.debug('created!');
        let err;

        //require at least two players to start a game.
        if (minPlayers < 2) {
            err = new Error('Parameter [minPlayers] must be a positive integer of a minimum value of 2.');
        }

        if (minPlayers > maxPlayers) {
            err = new Error('Parameter [minPlayers] must be less than or equal to [maxPlayers].');
        }

        if (err) {
            throw err;
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

    public getPlayersPreview(): PlayerPreview[] {
        return this.players.map(player => {
            return {
                id: player.id,
                name: player.name,
                chips: player.chips,
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

    private removePlayerCards() {
        for (let player of this.players) {
            player.cards = [];
        }
    }

    private nextPlayer() {
        let nextIndex;
        do {
            // if last player, continue with first
            nextIndex = this.currentPlayer === this.players.length - 1 ? 0 : this.currentPlayer + 1;
        } while (this.players[nextIndex].folded);
        this.currentPlayer = nextIndex;
        this.commands$.next({ cmd: 'game:next_player', table: this.name, data: { nextPlayerID: this.players[this.currentPlayer].id } });
    }

    private getPlayerIndexByID(playerID: string) {
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

        this.players[playerIndex].bet(this.game.getMaxBet());
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

        this.players[playerIndex].bet(bet);
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

    private progress(): boolean {
        if (this.isEndOfRound()) {
            this.game.moveBetsToPot();

            const round = this.game.round.type;

            // if we are in the last round and everyone has either folded or called
            if (round === RoundType.River) {
                this.gameEnded();
                // stop the game progress since we are done
                Logger.debug('Game ended, starting a new one');
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

        const winners = this.calculateWinners();
        let earnings = this.game.pot;

        if (winners.length === 1) {
            Logger.debug(`Player[${ winners[0].name }] has won the game and receives ${ earnings }!`);
            winners[0].chips += earnings;
        } else {
            let winnerNames = winners.reduce((prev, cur) => prev + ', ' + cur.name, '');
            earnings = Math.round(earnings / winners.length);
            Logger.debug(`Players[${ winnerNames }] have a tie and split the pot for ${ earnings } each!`);

            for (const winner of winners) {
                winner.chips += earnings;
            }
        }


        // announce winner
        this.commands$.next({
            cmd: 'game_ended',
            table: this.name,
            data: { pot: this.game.pot, winners }
        });

        // reset player status
        this.players.map(player => player.reset());

        // auto-create new game
        this.newGame();
    }

    private calculateWinners(): Player[] {
        this.rankAllHands();

        // first find the highest hand
        const winner = this.players.reduce((prev, cur) => {
            return (prev.hand.value > cur.hand.value) ? prev : cur;
        });

        // then return all players with that hand
        return this.players.filter(player => player.hand.value === winner.hand.value);
    }

    private rankHand(player: Player) {
        player.hand = PokerEvaluator.evalHand([...player.cards, ...this.game.board]);
    }

    private rankAllHands() {
        for (let player of this.players) {
            this.rankHand(player);
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
