import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'poker-tooltip',
    templateUrl: './tooltip.component.html',
    styleUrls: ['./tooltip.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipComponent implements OnInit {

    @Input() text: string = 'Placeholder tooltip';

    constructor() { }

    ngOnInit(): void {
    }

}
