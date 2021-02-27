import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { PlayerOverview } from '../../../../../shared/src';

@Component({
    selector: 'game-controls',
    templateUrl: './game-controls.component.html',
    styleUrls: ['./game-controls.component.scss']
})
export class GameControlsComponent implements OnInit {

    @Input() maxBet$: Observable<number>;
    @Input() player: PlayerOverview;

    @Output() folded = new EventEmitter<void>();
    @Output() checked = new EventEmitter<void>();
    @Output() called = new EventEmitter<void>();
    @Output() bet = new EventEmitter<number>();

    _betAmount$: BehaviorSubject<number> = new BehaviorSubject(0);
    betAmount$ = this._betAmount$.asObservable();

    get betAmount(): number {
        return this._betAmount$.getValue();
    }

    constructor() { }

    ngOnInit(): void {
    }

    addBet(amount: number) {
        this._betAmount$.next(this.betAmount + amount);
    }

    onBetChange($event: Event) {
        const amount = +(<HTMLInputElement>$event.target).value;
        this._betAmount$.next(amount);
    }

    clearBet() {
        this._betAmount$.next(0);
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
}
