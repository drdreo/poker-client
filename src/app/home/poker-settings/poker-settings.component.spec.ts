import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokerSettingsComponent } from './poker-settings.component';

describe('PokerSettingsComponent', () => {
  let component: PokerSettingsComponent;
  let fixture: ComponentFixture<PokerSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PokerSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PokerSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
