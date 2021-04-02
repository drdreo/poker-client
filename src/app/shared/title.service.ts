import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
})
export class TitleService {

    private appTitle = 'Pokern ';

    get title(): string {
        return this._title;
    }

    set title(value: string) {
        this._title = value;
        this.setTitle(this._title);
    }

    private _title = this.appTitle;

    private timerUnsubscribe$ = new Subject();

    constructor(private titleService: Title) { }

    startAnimation() {
        timer(200, 200)
            .pipe(takeUntil(this.timerUnsubscribe$))
            .subscribe(() => {
                this.title = this._title.substr(1) + this._title.substr(0, 1);
            });

    }

    endAnimation() {
        this.timerUnsubscribe$.next();
        this.timerUnsubscribe$.complete();
        this.timerUnsubscribe$ = new Subject();
        this.resetTitle();
    }

    setTitle(title: string) {
        this.titleService.setTitle(title);
    }

    addTitle(title: string) {
        this._title = `${this.appTitle} - ${title}`;
    }

    resetTitle() {
        this.setTitle(this.appTitle);
    }
}
