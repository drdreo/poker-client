import { Table, TableCommand } from './Table';
import { Subject } from 'rxjs';


export class TableMock extends Table {
    nextGameDelay = 0;
    endGameDelay = 0;
    commands$ = new Subject<TableCommand>();
}
