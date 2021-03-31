import { Component, OnInit } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';

interface DialogData {
    title: string;
    withResult: boolean;
}

@Component({
    selector: 'poker-settings',
    templateUrl: './poker-settings.component.html',
    styleUrls: ['./poker-settings.component.scss']
})
export class PokerSettingsComponent implements OnInit {

    saved = false;

    constructor(public ref: DialogRef<DialogData>) {
        this.ref.beforeClose(() => {

            if (!this.saved) {
                this.saved = true;

                this.saveSettingsAndClose();
                return false;
            }
            return true;
        });
    }

    ngOnInit(): void {
    }

    private saveSettingsAndClose() {
        this.ref.close({ test: 1 });
    }
}
