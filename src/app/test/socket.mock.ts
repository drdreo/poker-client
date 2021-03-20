import { Observable } from 'rxjs';

export class SocketMock {

    emit() {

    }

    fromEvent() {
        return new Observable();
    }
}
