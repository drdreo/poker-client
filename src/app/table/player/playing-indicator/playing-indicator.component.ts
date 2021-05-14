import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Forked and Inspiration from https://codesandbox.io/s/basetimer-vanillajs-m1prg
 * Props to Mateusz Rybczonek
 */
@Component({
    selector: 'poker-playing-indicator',
    templateUrl: './playing-indicator.component.html',
    styleUrls: ['./playing-indicator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayingIndicatorComponent {

    @Input() timer$: Observable<number> | null;
    @Input() totalTime: number;

    state: string;

    circleDasharray = '283';

    constructor() { }

    subscribeTimer(timeLeft: number): number {
        if (timeLeft > 0) {
            this.setCircleDasharray(timeLeft);
            this.setRemainingPathColor(timeLeft);
        }
        return timeLeft;
    }

    formatTime(time: number) {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const s = seconds < 10 ? `0${ seconds }` : seconds;
        const m = minutes > 0 ? `${ minutes }:` : '';
        return `${ m }${ s }`;
    }

    setRemainingPathColor(timeLeft) {
        if (timeLeft <= this.totalTime * 0.25) {
            this.state = 'alert';
        } else if (timeLeft <= this.totalTime * 0.5) {
            this.state = 'warning';
        } else {
            this.state = 'info';
        }
    }


    setCircleDasharray(timeLeft: number) {
        this.circleDasharray = `${ (this.calculateTimeFraction(timeLeft) * 283).toFixed(0) } 283`;
    }

    calculateTimeFraction(timeLeft: number) {
        const rawTimeFraction = timeLeft / this.totalTime;
        return rawTimeFraction - (1 / this.totalTime) * (1 - rawTimeFraction);
    }

    isNumber(val): boolean { return typeof val === 'number'; }
}
