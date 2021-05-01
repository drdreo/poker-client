import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogService } from '@ngneat/dialog';
import { Socket } from 'ngx-socket-io';
import { SocketMock } from '../../test/socket.mock';

import { TableInfosComponent } from './table-infos.component';

describe('TableInfosComponent', () => {
  let component: TableInfosComponent;
  let fixture: ComponentFixture<TableInfosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TableInfosComponent ],
      providers: [
        { provide: Socket, useClass: SocketMock },
        { provide: DialogService, useValue: 'dialog' },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableInfosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
