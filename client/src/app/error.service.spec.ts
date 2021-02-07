import { TestBed } from '@angular/core/testing';
import { Socket } from 'ngx-socket-io';

import { ErrorService } from './error.service';
import { SocketMock } from './test/socket.mock';

describe('ErrorService', () => {
    let service: ErrorService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: Socket, useClass: SocketMock }]
        });
        service = TestBed.inject(ErrorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
