import { Logger } from '@nestjs/common';
import { RoundType } from '../../shared/src';


export class Game {
    public pot: number = 0;
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
            this.deck.pop(); //Burn a card
            // play 3 flop cards
            for (let i = 0; i < 3; i++) {
                this.board.push(this.deck.pop());
            }
        } else if (type === RoundType.Turn || type === RoundType.River) {
            this.deck.pop(); //Burn a card
            this.board.push(this.deck.pop());
        }
    }

    getBet(playerIndex: number): number | undefined {
        return this.round.bets[playerIndex];
    }

    hasBet(playerIndex: number): boolean {
        return !!this.round.bets[playerIndex];
    }

    getMaxBet(): number {
        return this.round.bets.reduce((p, c) => {
            return (p > c ? p : c);
        }, 0);
    }

    check(playerIndex: number) {
        this.round.bets[playerIndex] = 0;
    }

    call(playerIndex: number) {
        this.round.bets[playerIndex] = this.getMaxBet();
    }

    bet(playerIndex: number, bet: number) {
        this.round.bets[playerIndex] = bet;
    }

    moveBetsToPot() {
        this.pot += this.round.bets.reduce((prev, cur) => prev + cur, 0);
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
}

// RoundTypes: Deal,Flop,Turn,River,Showdown
// BetTypes: Bet,Raise,ReRaise, cap
export class Round {
    bets: number[] = [];

    // betName: BetType = BetType.Bet;

    constructor(public type: RoundType) { }
}
