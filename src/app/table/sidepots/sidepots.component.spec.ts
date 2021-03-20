import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidepotsComponent } from './sidepots.component';

describe('SidepotsComponent', () => {
  let component: SidepotsComponent;
  let fixture: ComponentFixture<SidepotsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SidepotsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidepotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
