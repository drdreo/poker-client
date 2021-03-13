import { ChangeDetectionStrategy, Component, HostBinding, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
    selector: 'poker-chips',
    templateUrl: './chips.component.html',
    styleUrls: ['./chips.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChipsComponent implements OnChanges {

    @Input() amount: number;
    @Input() type: number;
    @Input() direction: string = 'top';

    @HostBinding('class.inactive')
    inactive: boolean = false;

    // available chips
    private chips = [100, 50, 10, 5, 1];

    constructor() { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.amount.currentValue && this.getChipsFor(changes.amount.currentValue, this.type) === 0) {
            this.inactive = true;
        } else {
            this.inactive = false;
        }
    }

    getArray(number: number) {
        return Array(number).fill(0).map((x, i) => i);
    }

    getChipsFor(total: number, coin: number) {
        // prep chips
        const coins = this.chips.map(c => {
            return { amount: 0, value: c };
        });

        let tmp_rest = total;

        for (let c of coins) {
            if (tmp_rest <= 0) {
                break;
            }

            while (tmp_rest - c.value >= 0) {
                tmp_rest -= c.value;
                c.amount++;
            }
        }
        const c = coins.find(c => c.value === coin);
        if (!c) {
            console.warn('Couldnt find coin', coin);
        }
        return c.amount;
    }

    getChipPosition(i: number) {
        if (this.direction === 'bottom') {
            return { 'bottom.px': (-2 + (i * 5)) };
        }
        return { 'top.px': (-2 + (i * 5)) };
    }
}
