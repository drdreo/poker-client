import { Component, OnInit, EventEmitter, Output, Input, ChangeDetectionStrategy } from '@angular/core';
import { PlayerOverview, BetType } from '@shared/src';
import { Observable, BehaviorSubject } from 'rxjs';

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
        { amount: 0.5, title: '0.5 BB', type: BetTemplateType.BigBlind },
        { amount: 1, title: '1 BB', type: BetTemplateType.BigBlind },
        { amount: 2, title: '2 BB', type: BetTemplateType.BigBlind },
        { amount: 1, title: '1 Pot', type: BetTemplateType.Pot },
        { amount: 1, title: 'All In', type: BetTemplateType.Bank }
    ];

    _betAmount$: BehaviorSubject<number> = new BehaviorSubject(0);
    betAmount$ = this._betAmount$.asObservable();

    get betAmount(): number {
        return this._betAmount$.getValue();
    }

    set betAmount(value: number) {
        if(value < 0){
            value = 0;
        }
        this._betAmount$.next(value);
    }

    constructor() { }

    ngOnInit(): void {
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
        this.betAmount = 10; // set to minimum bet
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
}
