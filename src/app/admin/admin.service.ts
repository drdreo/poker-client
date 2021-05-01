import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AdminResponse } from '@shared/src';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AdminService {

    constructor(private http: HttpClient) { }

    fetchAdminInfo() {
        return this.http.get<AdminResponse>(environment.admin_api + '/info').toPromise();
    }

    removeTable(table: string) {
        return this.http.delete<AdminResponse>(environment.admin_api + '/table').toPromise();
    }

    kickPlayer(playerID: string) {
        return this.http.delete<AdminResponse>(environment.admin_api + '/player').toPromise();
    }
}
