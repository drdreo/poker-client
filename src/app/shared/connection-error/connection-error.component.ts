import { Component, OnInit } from '@angular/core';
import { DialogRef, DialogContentData } from '@ngneat/dialog';

interface ConnectionErrorData extends DialogContentData {
    error: string;
}

@Component({
    selector: 'poker-connection-error',
    templateUrl: './connection-error.component.html',
    styleUrls: ['./connection-error.component.scss']
})
export class ConnectionErrorComponent implements OnInit {

    constructor(public ref: DialogRef<ConnectionErrorData>) {

    }

    ngOnInit(): void {
    }

}
