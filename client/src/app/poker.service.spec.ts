import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Socket } from 'ngx-socket-io';

import { PokerService } from './poker.service';
import { SocketMock } from './test/socket.mock';

describe('PokerService', () => {
    beforeEach(() => TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [{ provide: Socket, useClass: SocketMock }]
    }));

    it('should be created', () => {
        const service: PokerService = TestBed.get(PokerService);
        expect(service).toBeTruthy();
    });
});
