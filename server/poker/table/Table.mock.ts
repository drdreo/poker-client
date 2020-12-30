import { Table, TableCommand } from './Table';
import { Subject } from 'rxjs';


export class TableMock extends Table {
    gameEndDelay = 0;
    commands$ = new Subject<TableCommand>();
}
