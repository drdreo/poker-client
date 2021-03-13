import { Table} from './Table';
import { Subject } from 'rxjs';
import { TableCommand } from './TableCommand';


export class TableMock extends Table {
    commands$ = new Subject<TableCommand>();
}
