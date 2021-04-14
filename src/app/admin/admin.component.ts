import { Component, OnInit } from '@angular/core';
import { DialogService } from '@ngneat/dialog';
import { AdminResponse } from '@shared/src';
import { Observable, BehaviorSubject } from 'rxjs';
import { AdminService } from './admin.service';

@Component({
    selector: 'poker-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

    private _adminInfo$ = new BehaviorSubject<AdminResponse>(null);
    adminInfo$: Observable<AdminResponse> = this._adminInfo$.asObservable();
    adminInfo: AdminResponse;

    showSockets = false;
    table: any;

    constructor(private adminService: AdminService, private dialog: DialogService) {
        this.adminService.fetchAdminInfo()
            .then(info => {
                this.adminInfo = info;
                this._adminInfo$.next(info);
            });
    }

    ngOnInit(): void {
    }

    getSocketsWithPlayerID(sockets: any[]): number {
        return sockets.filter(socket => !!socket.playerID).length;
    }

    getPlayersWithoutTable(sockets: any[], tables: any[]): number {
        return sockets.filter(socket => tables.every(table => table.players?.every(player => player.id !== socket.playerID))).length;
    }

    getPlayersFromTables(tables: any[]): number {
        return tables.reduce((prev, cur) => prev + cur.players?.length, 0);
    }

    getUptime(uptime: number) {
        return new Date(0, 0, 0, 0, 0, 0, 0).setSeconds(uptime);
    }

    showTableOfPlayer(playerID: string) {
        const playerTable = this.adminInfo.tables.find(table => table.players.find(player => player.id === playerID));
        if (playerTable) {
            this.selectTable(playerTable);
        }
    }

    selectTable(table: any) {
        this.table = table;
    }

    removeTable(table: string) {
        this.dialog
            .confirm({
                title: 'Are you sure to remove this table?',
                body: 'This will crash all clients!'
            }).afterClosed$.subscribe(confirmed => {
            console.log(confirmed);
            // this.adminService.removeTable(table);
        });
    }

    kickPlayer(table: string) {
        this.dialog
            .confirm({
                title: 'Confirm Action',
                body: 'Are you sure to remove this player?'
            }).afterClosed$
            .subscribe(confirmed => {
                if (confirmed) {
                    this.adminService.removeTable(table);
                }
            });
    }
}
