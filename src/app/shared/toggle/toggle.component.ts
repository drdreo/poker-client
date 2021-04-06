import { Component, OnInit, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';


export const CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ToggleComponent),
    multi: true
};

// https://codepen.io/aaroniker/pen/rZPeYQ

@Component({
    selector: 'app-toggle',
    templateUrl: './toggle.component.html',
    styleUrls: ['./toggle.component.scss'],
    providers: [CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR]
})
export class ToggleComponent implements OnInit, ControlValueAccessor {
    @Input() checked = false;
    disabled: boolean;

    constructor() { }

    ngOnInit(): void {
    }

    // the control’s value changes in the UI.
    registerOnChange(fn: any) {
        this.propagateChange = fn;
    }

    // Interaction with the UI element e.g, blur
    registerOnTouched(fn: any) {
        this.propagateTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    writeValue(checked: boolean) {
        this.checked = checked;
    }

    onChange() {
        this.checked = !this.checked;
        this.propagateChange(this.checked);
    }

    onBlur($event: FocusEvent) {
        this.propagateTouched($event);
    }

    propagateChange: any = () => {};
    propagateTouched: any = () => {};
}
