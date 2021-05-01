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
            console.log('Starting turn timer');
            this.endTurnTimer();
            // @ts-ignore
            const seconds = this.config.turn.time;
            interval(1000).pipe(
                map(num => seconds - num),
                takeUntil(this.stopTurnTimer$),
                takeUntil(this.unsubscribe$)
            ).subscribe(time => {
                console.log(time);
                if (time < 0) {
                    this.endTurnTimer();
                } else {
                    this.turnTimer$.next(time);
                }
            });
        }
    }

    endTurnTimer() {
        console.log('Ending turn timer');
        this.stopTurnTimer$.next();
        this.turnTimer$.next(null);
    }
}
