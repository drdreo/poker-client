import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandRanksComponent } from './hand-ranks.component';

describe('HandRanksComponent', () => {
  let component: HandRanksComponent;
  let fixture: ComponentFixture<HandRanksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HandRanksComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HandRanksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
