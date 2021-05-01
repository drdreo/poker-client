import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';

@Component({
    selector: 'poker-settings',
    templateUrl: './poker-settings.component.html',
    styleUrls: ['./poker-settings.component.scss']
})
export class PokerSettingsComponent implements OnInit {

    saved = false;
    settingsForm;

    constructor(public ref: DialogRef, private formBuilder: FormBuilder) {

        this.settingsForm = this.formBuilder.group({
            spectatorsAllowed: [true],
            isPublic: [true],
            music: [{ value: false, disabled: true }],
            chips: [1000],
            turn: this.formBuilder.group({
                time: [{ value: -1, disabled: false }],
            }),
            blinds: this.formBuilder.group({
                small: [10],
                big: [20],
                duration: [{ value: -1, disabled: true }]
            }),
            players: this.formBuilder.group({
                max: [8]
            }),
            table: this.formBuilder.group({
                autoClose: [true],
                rebuy: [{ value: false, disabled: true }]
            })
        });

        const persistedSettings = JSON.parse(localStorage.getItem('poker-settings'));
        if (persistedSettings) {
            this.settingsForm.patchValue(persistedSettings);
        }

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
        localStorage.setItem('poker-settings', JSON.stringify(this.settingsForm.value));
        this.ref.close(this.settingsForm.value);
    }

}
