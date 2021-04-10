import { Component, OnInit } from '@angular/core';
import { AdminResponse } from '@shared/src';
import { Observable } from 'rxjs';
import { AdminService } from './admin.service';

@Component({
    selector: 'poker-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

    adminInfo$: Observable<AdminResponse>;
    showSockets = false;

    constructor(private adminService: AdminService) {
        this.adminInfo$ = this.adminService.fetchAdminInfo();
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
}
