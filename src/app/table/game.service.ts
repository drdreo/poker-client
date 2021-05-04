import { Injectable, OnDestroy } from '@angular/core';
import { DefaultConfig } from '@shared/src';
import { Subject, interval, BehaviorSubject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

@Injectable()
export class GameService implements OnDestroy {
    config: DefaultConfig;
    rounds = 1;

    turnTimer$: BehaviorSubject<number> = new BehaviorSubject(null);
    stopTurnTimer$ = new Subject();

    private unsubscribe$ = new Subject();

    constructor() { }

    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    setTableConfig(config: DefaultConfig) {
        this.config = config;
    }

    startTurnTimer() {
        if (this.config.turn.time > 1) {
            this.endTurnTimer();
            const seconds = this.config.turn.time;
            interval(1000).pipe(
                map(num => seconds - num),
                takeUntil(this.stopTurnTimer$),
                takeUntil(this.unsubscribe$)
            ).subscribe(time => {
                if (time < 0) {
                    this.endTurnTimer();
                } else {
                    this.turnTimer$.next(time);
                }
            });
        }
    }

    endTurnTimer() {
        this.stopTurnTimer$.next();
        this.turnTimer$.next(null);
    }
}
