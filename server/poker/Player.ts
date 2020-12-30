import { EvaluatedHand } from 'poker-evaluator/lib/types';
import { WsException } from '@nestjs/websockets';


export type PlayerPreview = Omit<Player, 'cards' | 'hand' | 'reset' | 'pay'>;

export class Player {
    public cards: string[] = [];
    public hand: EvaluatedHand | null;
    public folded = false;
    public allIn = false;
    disconnected: boolean = false;

    constructor(public id: string, public name: string, public color: string, public chips: number) {
    }

    reset() {
        this.folded = false;
        this.allIn = false;
        this.hand = null;
        this.cards = [];
    }

    pay(bet: number) {
        if (this.chips - bet < 0) {
            throw new WsException(`Not sufficient funds to bet[${ bet }]!`);
        }
        this.chips -= bet;
    }
}
