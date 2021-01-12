import { Logger } from '@nestjs/common';

export enum RoundType {
    Deal,
    Flop,
    Turn,
    River
}

export enum BetType {
    Bet,
    Raise,
    ReRaise,
}

export class Game {
    public pot: number = 0;
    public round: Round;
    public deck: string[] = [];
    public board: string[] = [];
    public ended: boolean = false;

    constructor(private smallBlind: number, private bigBlind: number) {
        Logger.debug('Game started!');
        this.fillDeck();

        this.newRound(RoundType.Deal); //Start the first round
    }

    newRound(type: RoundType) {
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

    getMaxBet(): number {
        return this.round.bets.reduce((p, c) => {
            return (p > c ? p : c);
        });
    }

    hasSmallAndBigBlind(): boolean {
        // check if at least two blind bets exist
        return this.round.bets.filter(bet => bet).length >= 2;
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
        // this.deck.push('AS');
        // this.deck.push('KS');
        // this.deck.push('QS');
        // this.deck.push('JS');
        // this.deck.push('TS');
        // this.deck.push('9S');
        // this.deck.push('8S');
        // this.deck.push('7S');
        // this.deck.push('6S');
        // this.deck.push('5S');
        // this.deck.push('4S');
        // this.deck.push('3S');
        // this.deck.push('2S');
        // this.deck.push('AH');
        // this.deck.push('KH');
        // this.deck.push('QH');
        // this.deck.push('JH');
        // this.deck.push('TH');
        // this.deck.push('9H');
        // this.deck.push('8H');
        // this.deck.push('7H');
        // this.deck.push('6H');
        // this.deck.push('5H');
        // this.deck.push('4H');
        // this.deck.push('3H');
        // this.deck.push('2H');
        // this.deck.push('AD');
        // this.deck.push('KD');
        // this.deck.push('QD');
        // this.deck.push('JD');
        // this.deck.push('TD');
        // this.deck.push('9D');
        // this.deck.push('8D');
        // this.deck.push('7D');
        // this.deck.push('6D');
        // this.deck.push('5D');
        // this.deck.push('4D');
        // this.deck.push('3D');
        // this.deck.push('2D');
        // this.deck.push('AC');
        // this.deck.push('KC');
        // this.deck.push('QC');
        // this.deck.push('JC');
        // this.deck.push('TC');
        // this.deck.push('9C');
        // this.deck.push('8C');
        // this.deck.push('7C');
        // this.deck.push('6C');
        // this.deck.push('5C');
        // this.deck.push('4C');
        // this.deck.push('3C');
        // this.deck.push('2C');

        //Shuffle the deck array with Fisher-Yates
        for (let i = 0; i < this.deck.length; i++) {
            let j = Math.floor(Math.random() * (i + 1));
            let tmp = this.deck[i];
            this.deck[i] = this.deck[j];
            this.deck[j] = tmp;
        }
    }

    end() {
        this.ended = true;
    }
}

// RoundTypes: Deal,Flop,Turn,River,Showdown
// BetTypes: Bet,Raise,ReRaise, cap
class Round {
    bets: number[] = [];
    betName: BetType = BetType.Bet;

    constructor(public type: RoundType) { }
}
