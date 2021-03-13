import { Logger } from '@nestjs/common';
import { RoundType, BetType } from '../../../shared/src';
import { Player } from './Player';


export class Game {
    public pot: number = 0;
    public sidePots: SidePot[] = [];
    public round: Round;
    public deck: string[] = [];
    public board: string[] = [];
    public ended: boolean = false;

    private logger;

    constructor(private smallBlind: number, private bigBlind: number, context?: string) {
        this.logger = new Logger(context ? context : Game.name);
        this.logger.debug('Started!');
        this.fillDeck();

        this.newRound(RoundType.Deal); //Start the first round
    }

    newRound(type: RoundType) {
        this.logger.debug(`New Round[${ type }]`);

        this.round = new Round(type);
        if (type === RoundType.Flop) {
            this.deck.pop(); // Burn a card
            // play 3 flop cards
            for (let i = 0; i < 3; i++) {
                this.board.push(this.deck.pop());
            }
        } else if (type === RoundType.Turn || type === RoundType.River) {
            this.deck.pop(); //Burn a card
            this.board.push(this.deck.pop());
        }
    }

    getBetAmount(playerIndex: number): number | undefined {
        return this.round.bets[playerIndex]?.amount;
    }

    getBet(playerIndex: number): Bet | undefined {
        return this.round.bets[playerIndex];
    }

    hasBet(playerIndex: number): boolean {
        return !!this.round.bets[playerIndex];
    }

    // Returns the index of the player with the last bet or undefined
    getLastBet(): { index: number, bet: number } | null {

        for (let index = 0; index < this.round.bets.length; index++) {
            let bet = this.round.bets[index];
            if (bet.amount > 0) {
                return { index, bet: bet.amount };
            }
        }

        return null;
    }

    getLowestBet(): number {
        let lowest = Number.POSITIVE_INFINITY;
        for (let bet of this.round.bets) {
            if (bet?.amount > 0) {
                lowest = Math.min(lowest, bet.amount);
            }
        }

        return lowest;
    }

    getMaxBet(): number {
        return this.round.bets.reduce((maxBet, bet) => {
            return (maxBet > bet.amount ? maxBet : bet.amount);
        }, 0);
    }

    check(playerIndex: number) {
        const playersBet = this.getBetAmount(playerIndex);
        this.round.bets[playerIndex] = new Bet(playersBet || 0, BetType.Check);
    }

    call(playerIndex: number) {
        this.round.bets[playerIndex] = new Bet(this.getMaxBet(), BetType.Call);
    }


    bet(playerIndex: number, bet: Bet) {
        this.round.bets[playerIndex] = bet;
    }

    betNewBet(playerIndex: number, amount: number, type: BetType) {
        this.round.bets[playerIndex] = new Bet(amount, type);
    }

    moveBetsToPot() {
        const bets = this.round.bets.reduce((prev, cur) => prev + cur.amount, 0);
        this.pot += bets;
    }

    createSidePot(potPlayers: Player[]) {
        this.sidePots.push(new SidePot(this.pot, potPlayers));
        this.pot = 0;
        potPlayers.filter(player => player.allIn).forEach(player => player.hasSidePot = true);
    }

    fillDeck() {
        const figures = ['S', 'H', 'D', 'C'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

        figures.forEach((fig) => {
            values.forEach(v => {
                this.deck.push(v + fig);
            });
        });

        // shuffle the deck array with Fisher-Yates
        for (let i = 0; i < this.deck.length; i++) {
            let j = Math.floor(Math.random() * (i + 1));
            let tmp = this.deck[i];
            this.deck[i] = this.deck[j];
            this.deck[j] = tmp;
        }
    }

    end() {
        this.logger.debug(`Ended`);

        this.ended = true;
    }

    resetPots() {
        this.pot = 0;
        this.sidePots = [];
    }
}

// RoundTypes: Deal,Flop,Turn,River,Showdown
// BetTypes: Bet,Raise,ReRaise, cap
export class Round {
    bets: Bet[] = [];

    constructor(public type: RoundType) { }
}

export class Bet {
    constructor(public amount: number, public type: BetType) {}
}

export class SidePot {
    constructor(public amount: number, public players: Player[]) { }
}

