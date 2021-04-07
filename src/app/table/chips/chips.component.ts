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
    @Input() direction = 'top';

    @HostBinding('class.inactive')
    inactive = false;

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

    getArray(num: number) {
        return Array(num).fill(0).map((x, i) => i);
    }

    getChipsFor(total: number, chipValue: number) {
        // prep chips
        const chips = this.chips.map(c => ({ amount: 0, value: c }));

        let tmp_rest = total;

        for (const chip of chips) {
            if (tmp_rest <= 0) {
                break;
            }

            while (tmp_rest - chip.value >= 0) {
                tmp_rest -= chip.value;
                chip.amount++;
            }
        }
        const chip = chips.find(c => c.value === chipValue);
        if (!chip) {
            console.warn('Couldnt find chip with value: ', chipValue);
        }
        return chip.amount;
    }

    getChipPosition(i: number) {
        // split stacks
        let splitStack;
        if (i >= 20) {
            splitStack = { 'left.px': 17 };
            i -= 20;
        }
        if (this.direction === 'bottom') {
            return { 'bottom.px': (-2 + (i * 5)), ...splitStack };
        }
        return { 'top.px': (-2 + (i * 5)), ...splitStack };
    }
}
