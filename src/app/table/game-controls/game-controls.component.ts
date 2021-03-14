import { Component, OnInit, EventEmitter, Output, Input, ChangeDetectionStrategy } from '@angular/core';
import { PlayerOverview, BetType } from '@shared/src';
import { Observable, BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

enum BetTemplateType {
    BigBlind,
    Pot,
    Bank
}

interface BetTemplate {
    amount: number;
    title: string;
    type: BetTemplateType;
}

@Component({
    selector: 'game-controls',
    templateUrl: './game-controls.component.html',
    styleUrls: ['./game-controls.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameControlsComponent implements OnInit {

    BetType = BetType;

    @Input() maxBet$: Observable<number>;
    @Input() pot: number;
    @Input() bigBlind: number;
    @Input() player: PlayerOverview;

    @Output() folded = new EventEmitter<void>();
    @Output() checked = new EventEmitter<void>();
    @Output() called = new EventEmitter<void>();
    @Output() bet = new EventEmitter<number>();

    showPopup: boolean = false;
    betTemplates: BetTemplate[] = [
        { amount: 1, title: '1 BB', type: BetTemplateType.BigBlind },
        { amount: 2, title: '2 BB', type: BetTemplateType.BigBlind },
        { amount: 0.5, title: '0.5 Pot', type: BetTemplateType.Pot },
        { amount: 1, title: '1 Pot', type: BetTemplateType.Pot },
        { amount: 1, title: 'All In', type: BetTemplateType.Bank }
    ];

    _betAmount$: BehaviorSubject<number> = new BehaviorSubject(0);
    betAmount$ = this._betAmount$.asObservable();

    get betAmount(): number {
        return this._betAmount$.getValue();
    }

    set betAmount(value: number) {
        if (value < 0) {
            value = 0;
        } else if (value > this.player.chips) {
            value = this.player.chips;
        }
        this._betAmount$.next(value);
    }


    minimumBet = 20; // min raise is 1 BB

    constructor() { }

    ngOnInit(): void {
        // init the bet amount to the current max bet
        this.maxBet$.pipe(take(1)).subscribe(maxBet => {
            this.betAmount = maxBet > 0 ? maxBet : this.minimumBet;
        });
    }

    togglePopup() {
        this.showPopup = !this.showPopup;
    }

    closePopup() {
        this.showPopup = false;
    }

    addBet(amount: number) {
        this.betAmount += amount;
    }

    onBetChange($event: Event) {
        const amount = +(<HTMLInputElement>$event.target).value;
        this.betAmount = amount;
    }

    clearBet() {
        this.betAmount = this.minimumBet;
    }

    onFold() {
        this.folded.emit();
    }

    onCheck() {
        this.checked.emit();
    }

    onCall() {
        this.called.emit();
    }

    onBet() {
        this.bet.emit(this.betAmount);
        this.closePopup();
    }

    onAllIn() {
        this.bet.emit(this.player.chips);
        this.closePopup();
    }

    setBetFromTemplate(tmpl: BetTemplate) {
        console.log(this.pot);
        switch (tmpl.type) {
            case BetTemplateType.BigBlind:
                this.betAmount = this.bigBlind * tmpl.amount;
                break;
            case BetTemplateType.Pot:
                this.betAmount = this.pot * tmpl.amount;
                break;
            case BetTemplateType.Bank:
                this.betAmount = this.player.chips * tmpl.amount;
                break;
            default:
                console.warn('BetTemplate not handled', tmpl);
        }
    }

    onMouseWheel($event: WheelEvent) {
        const wheelStep = 10;
        const delta = $event.deltaY;

        if (delta > 0) {
            this.betAmount -= wheelStep;
        } else {
            this.betAmount += wheelStep;
        }
    }

    getCallAmount(maxBet: number): number {
        let callAmount = this.player.bet ? maxBet - this.player.bet.amount : maxBet;
        return callAmount > this.player.chips ? this.player.chips : callAmount;
    }

    hasToAllIn(maxBet): boolean {
        if (maxBet === 0) {
            return false;
        }
        return maxBet - this.player.bet?.amount >= this.player.chips;
    }
}
