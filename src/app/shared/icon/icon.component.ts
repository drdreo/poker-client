import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'poker-icon',
    templateUrl: './icon.component.html',
    styleUrls: ['./icon.component.scss']
})
export class IconComponent implements OnInit {
    @Input() type: string;

    constructor() { }

    ngOnInit(): void {
    }

}
