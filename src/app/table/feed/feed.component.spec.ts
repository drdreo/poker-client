import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogService } from '@ngneat/dialog';
import { Socket } from 'ngx-socket-io';
import { SocketMock } from '../../test/socket.mock';

import { FeedComponent } from './feed.component';

describe('FeedComponent', () => {
    let component: FeedComponent;
    let fixture: ComponentFixture<FeedComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FeedComponent],
            providers: [
                { provide: Socket, useClass: SocketMock },
                { provide: DialogService, useValue: 'dialog' }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(FeedComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
