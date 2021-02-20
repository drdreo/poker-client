import { EvaluatedHand } from 'poker-evaluator/lib/types';
import { WsException } from '@nestjs/websockets';
import { Winner } from '../../shared/src';

export class Player {
    cards: string[] = [];
    hand: EvaluatedHand | null;
    bet: number | null = 0;
    folded = false;
    allIn = false;
    hasSidePot = false;
    disconnected: boolean = false;

    constructor(public id: string, public name: string, public color: string, public chips: number) {
    }

    reset() {
        this.folded = false;
        this.allIn = false;
        this.hasSidePot = false;
        this.hand = null;
        this.cards = [];
        this.bet = null;
    }

    pay(bet: number) {
        if (this.chips - bet < 0) {
            throw new WsException(`Not sufficient funds to bet[${ bet }]!`);
        }
        this.chips -= bet;
    }

    formatWinner() {
        return {
            id: this.id,
            name: this.name,
            allIn: this.allIn,
            hand: this.hand,
        }
    }
}
