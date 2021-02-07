import { TestBed } from '@angular/core/testing';
import { Socket } from 'ngx-socket-io';
import { SocketMock } from '../test/socket.mock';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
    let service: NotificationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: Socket, useClass: SocketMock }]
        });
        service = TestBed.inject(NotificationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
