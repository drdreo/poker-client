import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { ChipsComponent } from '../chips/chips.component';

import { GameControlsComponent } from './game-controls.component';

describe('GameControlsComponent', () => {
  let component: GameControlsComponent;
  let fixture: ComponentFixture<GameControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GameControlsComponent, ChipsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameControlsComponent);
    component = fixture.componentInstance;
    component.maxBet$ = new Observable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
