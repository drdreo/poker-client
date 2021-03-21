import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { SidePot } from '@shared/src';
import { sidePotSlideAnimation, fadeInSlideOutAnimation } from 'app/shared/animations';
import { Observable } from 'rxjs';

@Component({
    selector: 'poker-sidepots',
    templateUrl: './sidepots.component.html',
    styleUrls: ['./sidepots.component.scss'],
    animations: [sidePotSlideAnimation, fadeInSlideOutAnimation],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidepotsComponent implements OnInit {

    @Input() sidePots$: Observable<SidePot[]>;

    constructor() { }

    ngOnInit(): void {
    }

}
