import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Socket } from 'ngx-socket-io';
import { PokerService } from '../poker.service';
import { PokerServiceMock } from '../poker.service.mock';
import { SocketMock } from '../test/socket.mock';
import { ChipsComponent } from './chips/chips.component';
import { FeedComponent } from './feed/feed.component';
import { TableInfosComponent } from './table-infos/table-infos.component';

import { TableComponent } from './table.component';

describe('TableComponent', () => {
    let component: TableComponent;
    let fixture: ComponentFixture<TableComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
            declarations: [TableComponent, ChipsComponent, TableInfosComponent, FeedComponent],
            providers: [
                { provide: Socket, useClass: SocketMock },
                { provide: PokerService, useClass: PokerServiceMock }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TableComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
